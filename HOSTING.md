# Hosting your own survev server
Looking to host your own survev server to mess around or play against friends? This is the place for you.

## Prerequisites
Before diving into the setup instructions, make sure you have the correct tools for the job. Hosting a dedicated survev server requires two things:
 * SSH access to a VPS (or some other form of dedicated hosting)
 * The ability to open ports on said machine

You can find cheap VPS hosts at [Ionos](https://www.ionos.com/), [A2 Hosting](https://www.a2hosting.com), or [Vultr](https://www.vultr.com/).

**NOTE:** I am not endorsing or recommending any of the following hosts, they are just a few I have found people to use.

If you accept the risk, you can host a dedicated server on your home network. However, you will need to [port forward](https://en.wikipedia.org/wiki/Port_forwarding) the necessary ports via your router for others to access your server. Do not do this unless you understand what you are doing. Previous Linux knowledge required.

## Setup
This tutorial is written assuming you are using [Ubuntu 20.04](https://ubuntu.com/). Follow accordingly based on the distribution you are using.

### Logging into the machine 
If you bought a VPS (or other form of hosting) from a hosting company, then these credentials should be accessible via their dashboard. Typically, they will consist of three things:
 * **IP:** The IP of your server.
 * **Username** The username (usually root), to log in with.
 * **Password:** The password to log in with.

Optionally, if your VPS provides SSH access on a different port, that will also be listed.

Open a terminal (Command Prompt for Windows) and write the following command:
```sh
ssh username@host
```
replacing username and host with your username and host.

If you have a custom SSH port (not 22), then use this instead:
```sh
ssh username@host -p port
```
additionally replacing port with the custom SSH port provided.

After writing this command, hit enter. You will be prompted for a password.

For security reasons, you cannot view your password as you type it. Type in the password, and hit enter.

If you see a notice notifying you of the machine you have just logged into, congratulations! You have succesfully SSH'd into your server.

### Dependencies
[Survev](https://github.com/leia-uwu/survev.git) requires a few dependencies:
 * [Git](https://git-scm.com)
 * [NGINX](https://nginx.org)
 * [Node.js](https://nodejs.org)
 * [pnpm](https://pnpm.io)
 * [PostgreSQL](https://www.postgresql.org)

If you are logged in as root, start by making sure sudo is installed:
```sh
apt -y install sudo
```

Then install git and nginx with the following command.
```sh
sudo apt -y install git nginx
```

To install Node.js, install the appropriate package from your distro, or for Ubuntu:
```sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - &&\
sudo apt-get install -y nodejs
```

And finally, install pnpm:
```sh
npm i -g pnpm
```

### Database support (optional)

IF you want to have accounts, leaderboards and IP bans, you will have to install and set-up PostgreSQL database

```sh
sudo apt install -y postgresql
sudo systemctl enable --now postgresql
sudo -u postgres createuser survev
sudo -u postgres createdb survev -O survev
```


### Building source
Next, move into `/opt`, clone the repository and traverse into it:
```sh
cd /opt
git clone https://github.com/leia-uwu/survev.git
cd survev
```

Run the initial setup script, this will prompt questions and generate a `survev-config.hjson` file.
If you want to view the config documentation look at configType.ts file

```sh
pnpm survev-setup
```

Build the client & server:
```sh
pnpm build
```

### Setting up NGINX
We will now setup NGINX to serve the client and API server.
If you are only hosting a game server you can skip this.

Make sure the build directory has the proper permissions:
```sh
sudo chown -R www-data:www-data /opt/survev/client/dist
```

First, remove the default file:
```sh
sudo unlink /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-available/default
```

Create a new file:
```sh
nano /etc/nginx/sites-available/survev.conf
```

And populate it with the following content:
```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _;

    # Static files cache
    location ~* \.(js|css|jpg|jpeg|png|gif|js|css|ico|svg)$ {
        expires 1y;
        etag off;
        if_modified_since off;
        add_header Cache-Control "public, no-transform";
        root /opt/survev/client/dist;
    }

    location ~* \.(html)$ {
        etag on;
        add_header Cache-Control "no-cache";
        root /opt/survev/client/dist;
    }

    # Client build
    location / {
        root /opt/survev/client/dist;
    }

    # API server
    location /api {
        proxy_http_version 1.1;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Host $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;

        proxy_pass "http://127.0.0.1:8000";
    }

    location /private {
        proxy_http_version 1.1;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Host $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;

        proxy_pass "http://127.0.0.1:8000";
    }

    # Team WebSocket server
    location /team_v2 {
        proxy_http_version 1.1;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Host $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $http_host;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        proxy_pass "http://127.0.0.1:8000";
        proxy_redirect off;
    }
}
```

Save the file using `Ctrl + X`, and press `Y` to confirm the file name.

To enable the configuration:
```sh
sudo ln -s /etc/nginx/sites-available/survev.conf /etc/nginx/sites-enabled/survev.conf
sudo systemctl restart nginx
```

### Running the game and API server

Next, we will create systemd unit files for the Game and API server.
which will ensure our application starts at boot and won't terminate if we end our SSH session:
If you are only hosting a game server, skip the API server part.

```sh
sudo nano /etc/systemd/system/survev-game.service
```

And populate it with the following content:
```ini
[Unit]
Description=survev dedicated game server.

[Service]
Type=simple
WorkingDirectory=/opt/survev/server
ExecStart=/usr/bin/pnpm start:game
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Save the file using `Ctrl + X`, and press `Y` to confirm the file name.

Enable the unit:
```sh
sudo systemctl enable --now survev-game
```

Now do the same for the API server if applicable:

```sh
sudo nano /etc/systemd/system/survev-api.service
```

And populate it with the following content:
```ini
[Unit]
Description=survev dedicated API server.

[Service]
Type=simple
WorkingDirectory=/opt/survev/server
ExecStart=/usr/bin/pnpm start:api
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
Save the file using `Ctrl + X`, and press `Y` to confirm the file name.

Enable the unit:
```sh
sudo systemctl enable --now survev-api
```

If you've done everything correctly, you should be able to access the server at `http://youriphere` (ex: `http://1.1.1.1`).

### Bot setup (optional)

Create a systemd unit file for the Bot

```sh
sudo nano /etc/systemd/system/survev-bot.service
```

populate it with

```sh
[Unit]
Description=survev bot.

[Service]
Type=simple
WorkingDirectory=/opt/survev/bot
ExecStart=/usr/bin/pnpm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Save and enable the unit:

```sh
sudo systemctl enable --now survev-bot
```