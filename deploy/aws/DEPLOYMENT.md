# AWS EC2 deployment

This guide deploys the Vite storefront/admin and the Express API to one EC2
instance. Nginx serves the frontend build and proxies `/api`, `/healthz`, and
`/readyz` to Express on loopback. MongoDB remains on the configured MongoDB
deployment; this does not migrate data or change providers.

## 1. Create and secure the instance

1. Launch a supported Ubuntu LTS EC2 instance and attach a DNS name to its
   static public IP (an Elastic IP is recommended).
2. Allow inbound SSH only from your trusted administration IP. Allow inbound
   HTTP (80) and HTTPS (443) from the public internet. Do **not** expose port
   5000 publicly.
3. Use an instance role with least-privilege access if retrieving configuration
   from AWS Systems Manager Parameter Store or Secrets Manager.
4. Connect by SSH and install the system packages:

   ```bash
   sudo apt update
   sudo apt install -y nginx git curl ca-certificates rsync
   ```

5. Install the Node.js major version required by `backend/package.json`
   (`>=20`) from a trusted Node.js distribution. Confirm `node --version` and
   `command -v node`; update `ExecStart` in the systemd unit if Node is not at
   `/usr/bin/node`.

## 2. Check out and build the application

Create a dedicated, non-login service account and application directory:

```bash
sudo useradd --system --create-home --home-dir /opt/tryvoxel --shell /usr/sbin/nologin tryvoxel
sudo install -d -o tryvoxel -g tryvoxel /opt/tryvoxel
sudo -u tryvoxel git clone https://github.com/prajapatideepak2370/Ecommerce--Website.git /opt/tryvoxel
```

For a private repository, configure a narrowly scoped deploy key or another
secure checkout method; do not place a personal access token in shell history
or the repository remote URL.

Install locked dependencies and create the static frontend build:

```bash
cd /opt/tryvoxel/backend
sudo -u tryvoxel npm ci --omit=dev

cd /opt/tryvoxel/frontend
sudo -u tryvoxel npm ci
sudo -u tryvoxel npm run build

sudo install -d -o www-data -g www-data /var/www/tryvoxel/dist
sudo rsync -a --delete /opt/tryvoxel/frontend/dist/ /var/www/tryvoxel/dist/
sudo chown -R www-data:www-data /var/www/tryvoxel/dist
```

The Nginx document root is `/var/www/tryvoxel/dist`. For atomic releases,
copy each build to a versioned directory and switch a symlink during deploy.

## 3. Configure backend secrets

Create `/etc/tryvoxel/backend.env` on the instance from the variable names in
[`../../backend/.env.example`](../../backend/.env.example). Set at least:

- `NODE_ENV=production`
- `HOST=127.0.0.1` (Nginx is on the same instance)
- `PORT=5000`
- `ATLASDB_URL`
- distinct `SECRET_KEY` and `ADMIN_SESSION_SECRET` values, each at least 32
  random characters
- `CORS_ORIGIN` and `ADMIN_ORIGIN` to the public HTTPS frontend origin, e.g.
  `https://shop.example.com`
- `FRONTEND_URL=https://shop.example.com`
- `GOOGLE_CALLBACK_URL` to
  `https://shop.example.com/api/v1/users/auth/google/callback`
- the required Google OAuth, SMTP, Cloudinary, and payment settings

Do not put secrets in Git, a Vite `VITE_*` variable, the systemd unit, or a
world-readable file. Prefer AWS Systems Manager Parameter Store
(SecureString) or Secrets Manager and a restricted instance role to provision
the environment file. If creating it manually:

```bash
sudo install -d -o root -g root -m 0750 /etc/tryvoxel
sudo install -o root -g tryvoxel -m 0640 /dev/null /etc/tryvoxel/backend.env
sudoedit /etc/tryvoxel/backend.env
```

Confirm the service account can read the file, but other local users cannot.
The MongoDB Atlas database user should have only the permissions the
application needs. Allow the EC2 instance's stable outbound IP in Atlas Network
Access; do not open Atlas access to all IPs. Permit outbound DNS and TLS
connections to the MongoDB deployment.

## 4. Install and start the systemd service

Install the provided unit, adjusting the Node executable path if needed:

```bash
sudo cp /opt/tryvoxel/deploy/aws/systemd/tryvoxel.service /etc/systemd/system/tryvoxel.service
sudo systemctl daemon-reload
sudo systemctl enable --now tryvoxel
sudo systemctl status tryvoxel
```

The process connects to MongoDB before listening and exits non-zero if initial
startup fails. systemd restarts unexpected failures. SIGTERM/SIGINT closes the
HTTP listener and Mongoose connection gracefully.

Check the local health endpoints:

```bash
curl --fail http://127.0.0.1:5000/healthz
curl --fail http://127.0.0.1:5000/readyz
curl --fail http://127.0.0.1:5000/api/v1/health
```

`/healthz` is process liveness. `/readyz` returns 503 unless the Mongoose
connection is ready. `/api/v1/health` retains the existing JSON API response.

## 5. Configure Nginx and HTTPS

Copy the provided Nginx server block, replace both `example.com` values with
your domain, and enable it:

```bash
sudo cp /opt/tryvoxel/deploy/aws/nginx/tryvoxel.conf /etc/nginx/sites-available/tryvoxel
sudoedit /etc/nginx/sites-available/tryvoxel
sudo ln -sfn /etc/nginx/sites-available/tryvoxel /etc/nginx/sites-enabled/tryvoxel
sudo nginx -t
sudo systemctl reload nginx
```

The configuration proxies API paths without stripping their `/api` prefix,
serves `/tvx-console` and its nested URLs from `admin.html`, and falls back to
`index.html` for storefront routes. Nginx forwards the original host, client
address, and HTTPS scheme; Express trusts the single reverse-proxy hop for
secure session cookies.

After DNS points to the instance, install Certbot using the official Ubuntu
instructions, then issue and install the certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d shop.example.com -d www.shop.example.com
sudo certbot renew --dry-run
```

Replace the sample domains with the configured DNS names. Verify the
certificate and HTTP-to-HTTPS redirect, then set the public HTTPS origins and
OAuth callback URL in the backend environment and restart the service. Keep frontend and API same-origin
so the existing secure session-cookie policies continue to work without
cross-site cookie changes.

If you serve the frontend from a different origin or static host, build with
`VITE_API_BASE` and `VITE_ADMIN_API_BASE` set to the HTTPS API URLs. Update
`CORS_ORIGIN`, `ADMIN_ORIGIN`, OAuth callback configuration, and cookie domain/
SameSite policy deliberately; do not weaken the current authentication
protections to work around an origin mismatch.

## 6. Updates, monitoring, and rollback

For an update, fetch the intended commit, install dependencies when lockfiles
change, rebuild the frontend, test the Nginx configuration, and restart:

```bash
cd /opt/tryvoxel
sudo -u tryvoxel git fetch origin
sudo -u tryvoxel git checkout <release-commit>
cd backend && sudo -u tryvoxel npm ci --omit=dev
cd ../frontend && sudo -u tryvoxel npm ci && sudo -u tryvoxel npm run build
sudo rsync -a --delete /opt/tryvoxel/frontend/dist/ /var/www/tryvoxel/dist/
sudo chown -R www-data:www-data /var/www/tryvoxel/dist
sudo nginx -t
sudo systemctl restart tryvoxel
```

Check service output with `sudo journalctl -u tryvoxel -n 200 --no-pager` and
follow it with `sudo journalctl -u tryvoxel -f`. Nginx access/error logs are
normally under `/var/log/nginx/`. Monitor `/readyz` for database readiness and
`/healthz` for process liveness; configure an external load balancer's health
check against `/readyz` if it should stop routing traffic when MongoDB is
unavailable.

For rollback, check out the previous known-good commit, reinstall its locked
backend/frontend dependencies if needed, rebuild the frontend, then restart
the service. Keep the prior release/build and environment backup protected
from public access; never include credentials in a rollback bundle.

## Frontend build-time API configuration

On this same-origin Nginx setup the production defaults are `/api/v1` and
`/api/admin`. When overriding them, configure the public Vite values before
building:

```bash
VITE_API_BASE=/api/v1 VITE_ADMIN_API_BASE=/api/admin npm run build
```

`VITE_*` values are embedded in public JavaScript bundles and must never
contain secrets.
