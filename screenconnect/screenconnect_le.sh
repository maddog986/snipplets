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
# ScreenConnect Lets Encrypt. v1.0.0
#
# To install:
# install certbot (one time)
#   cd /usr/local/sbin
#   wget https://dl.eff.org/certbot-auto
#   chmod a+x certbot-auto
#   ./certbot-auto certonly
#
# add to monthly cron run via a script file
#   sudo nano /etc/cron.monthly/screenconnect_le.sh
#
# give the script edit permissions
#   chmod a+x /etc/cron.monthly/screenconnect_le.sh
#
# manually run the script:
#   sudo /etc/cron.monthly/screenconnect_le.sh
#--------------------------------------------------

# Set the Domain name, valid DNS entry must exist
DOMAIN="sub.yourdomain.com" #must be any valid public accessible url

# NO NEED TO DO NOT EDIT BELOW --------------
# Stop the service
service screenconnect stop

#Renew the certificate
sudo certbot-auto renew --quiet --no-self-upgrade

#copy the pem file over to screen connect folder
cp /etc/letsencrypt/live/${DOMAIN}/cert.pem /opt/screenconnect/App_Runtime/etc/.mono/httplistener/443.cer

#convert the cert
openssl rsa -in /etc/letsencrypt/live/${DOMAIN}/privkey.pem -inform PEM -outform PVK -pvk-none -out /opt/screenconnect/App_Runtime/etc/.mono/httplistener/443.pvk

# Start the service
service screenconnect start
