Screen Connect LetsEncrypt support.

To install:
install certbot (one time). Follow through with the prompts.

```
cd /usr/local/sbin
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
./certbot-auto certonly
```

add to monthly cron run via a script file

```
sudo nano /etc/cron.monthly/screenconnect_le.sh
```

give the script edit permissions

```
chmod a+x /etc/cron.monthly/screenconnect_le.sh
```

manually run the script:

```
sudo /etc/cron.monthly/screenconnect_le.sh
```
