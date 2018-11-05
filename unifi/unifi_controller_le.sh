#!/bin/bash

# Copyright (C) 2018 Drew Gauderman <drew@dpg.host>
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
# Unifi Controller Lets Encrypt. v1.0.0
#
# To install:
# install certbot (one time)
#   cd /usr/local/sbin
#   wget https://dl.eff.org/certbot-auto
#   chmod a+x certbot-auto
#   ./certbot-auto certonly
#
# run certbot for the first time and follow through with the promps:
#   sudo certbot --nginx
#
# add to monthly cron run via a script file
#   sudo nano /etc/cron.monthly/unifi_controller_le.sh
#
# give the script edit permissions
#   chmod a+x /etc/cron.monthly/unifi_controller_le.sh
#
# manually run the script:
#   sudo /etc/cron.monthly/unifi_controller_le.sh
#--------------------------------------------------

# Stop the UniFi controller
service unifi stop

# Set the Domain name, valid DNS entry must exist
DOMAIN="sub.yourdomain.com" #must be any valid public accessible url

#backup previous keystore
cp /var/lib/unifi/keystore /var/lib/unifi/keystore.backup.$(date +%F_%R)

#Renew the certificate
sudo certbot-auto renew --quiet --no-self-upgrade

# Convert cert to PKCS12 format
sudo openssl pkcs12 -export -inkey /etc/letsencrypt/live/${DOMAIN}/privkey.pem -in /etc/letsencrypt/live/${DOMAIN}/fullchain.pem -out /etc/letsencrypt/live/${DOMAIN}/fullchain.p12 -name unifi -password pass:unifi

# Import certificate
sudo keytool -importkeystore -deststorepass aircontrolenterprise -destkeypass aircontrolenterprise -destkeystore /var/lib/unifi/keystore -srckeystore /etc/letsencrypt/live/${DOMAIN}/fullchain.p12 -srcstoretype PKCS12 -srcstorepass unifi -alias unifi -noprompt

# Start the UniFi controller
service unifi start
