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
# Unifi Video Lets Encrypt. v1.0.1
# To install: https://bleepingmachines.com/unifi-video-and-letsencrypt/
#
# Release Notes:
#   v1.0.1 - Added UNIFIPATH for custom install paths
#   v1.0.0 - Inital Release
#--------------------------------------------------

# Set the UNIFIDOMAIN name, that points to your NVR, a valid DNS entry must exist
UNIFIDOMAIN="nvr.yourdomain.com"

# Folder UNIFIPATH to your Unifi Video data. Depends on how it was installed.
# most common
UNIFIPATH="/var/lib/unifi-video"
# least common
#UNIFIPATH="/usr/lib/unifi-video/data"

# NO NEED TO DO NOT EDIT BELOW --------------

# Stop the UniFi Video service
service unifi-video stop

# Enable custom certificates in the system.properties for Unifi Video
grep -qxF 'ufv.custom.certs.enable=true' ${UNIFIPATH}/system.properties || echo "ufv.custom.certs.enable=true" >>${UNIFIPATH}/system.properties

#backup previous keystore
cp ${UNIFIPATH}/keystore ${UNIFIPATH}/keystore.backup.$(date +%F_%R)

#Renew the certificate
sudo certbot-auto renew --quiet --no-self-upgrade

# Convert cert to PKCS12 format
sudo openssl pkcs12 -export -inkey /etc/letsencrypt/live/${UNIFIDOMAIN}/privkey.pem -in /etc/letsencrypt/live/${UNIFIDOMAIN}/fullchain.pem -out /etc/letsencrypt/live/${UNIFIDOMAIN}/fullchain.p12 -name airvision -password pass:ubiquiti

# Import certificate
sudo keytool -importkeystore -deststorepass ubiquiti -destkeypass ubiquiti -destkeystore ${UNIFIPATH}/keystore -srckeystore /etc/letsencrypt/live/${UNIFIDOMAIN}/fullchain.p12 -srcstoretype pkcs12 -srcstorepass ubiquiti -alias airvision -noprompt

# Start the UniFi Video service
service unifi-video start
