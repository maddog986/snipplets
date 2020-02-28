#!/bin/bash

# Copyright (C) 2020 Drew Gauderman <drew@dpg.host>
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software
# and associated documentation files (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial
# portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
# PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
# FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
# ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#--------------------------------------------------
# Unifi Video Lets Encrypt. v1.0.0
#
# To install:
# ---------------------
#
# 1) install certbot (https://certbot.eff.org/instructions)
#   cd /usr/local/sbin
#   sudo wget https://dl.eff.org/certbot-auto
#   sudo chmod a+x certbot-auto
#   sudo ./certbot-auto certonly
#
# 2) save the script somewhere on the file system.
#    sudo nano /etc/unifi_video_le.sh
#       (paste all the code (this entire file) and save)
#
# 3) setup execute permissions:
#   chmod a+x /etc/unifi_video_le.sh
#
# 4) manually run the script:
#   sudo /etc/unifi_video_le.sh
#
# 5) Optional, create a cronjob to run once a month (https://www.geeksforgeeks.org/how-to-setup-cron-jobs-in-ubuntu/):
#   crontab -e
#     0 0 1 * * /etc/unifi_video_le.sh >/dev/null 2>&1
#--------------------------------------------------

# Set the Domain name, valid DNS entry must exist
DOMAIN="sub.yourdomain.com" #must be any valid public accessible url

# NO NEED TO DO NOT EDIT BELOW --------------

# Enable custom certificates in the system.properties for Unifi Video
grep -qxF 'ufv.custom.certs.enable=true' /var/lib/unifi-video/system.properties || echo "ufv.custom.certs.enable=true" >>/var/lib/unifi-video/system.properties

# Stop the UniFi controller
service unifi-video stop

#backup previous keystore
cp /var/lib/unifi-video/keystore /var/lib/unifi-video/keystore.backup.$(date +%F_%R)

#Renew the certificate
sudo certbot-auto renew --quiet --no-self-upgrade

# Convert cert to PKCS12 format
sudo openssl pkcs12 -export -inkey /etc/letsencrypt/live/${DOMAIN}/privkey.pem -in /etc/letsencrypt/live/${DOMAIN}/fullchain.pem -out /etc/letsencrypt/live/${DOMAIN}/fullchain.p12 -name airvision -password pass:ubiquiti

# Import certificate
sudo keytool -importkeystore -deststorepass ubiquiti -destkeypass ubiquiti -destkeystore /var/lib/unifi-video/keystore -srckeystore /etc/letsencrypt/live/${DOMAIN}/fullchain.p12 -srcstoretype PKCS12 -srcstorepass ubiquiti -alias airvision -noprompt

# Start the UniFi controller
service unifi-video start
