# dokutek
Plate-forme de gestion et téléversement de documents administratifs

# Pour le HTTPS

La configuration du HTTP nécessite les deux fichiers _https-files/dokutek-key.pem_ et _https-files/dokutek-cert.pem_. Pour les générer :

```bash
$ mkdir https-files
$ openssl genrsa -out dokutek-key.pem 1024 
$ openssl req -new -key dokutek-key.pem -out certrequest.csr
$ openssl x509 -req -in certrequest.csr -signkey dokutek-key.pem -out dokutek-cert.pem
```