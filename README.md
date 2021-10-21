# Kibo Import Export Helper Utility

## usage
* install the dependencies
```
npm i
```

* Copy example.env to an .env  
```
$ cp templates/example.env .env
```
* update the .env file with your tenant info and credentials
```
KIBO_APPLICATION_KEY=my.sample_app.1.0.0.Release
KIBO_SHARED_SECRET=d537b23b1acc4f768134686c2caa53fb
KIBO_API=https://t30294.sandbox.mozu.com
KIBO_HOME=https://home.mozu.com
KIBO_NAMESPACE=current
```
* create/modify an export template
```
{
  "domain": "catalog",
  "resources": [
    {
      "resource": "products",
      "format": "legacy",
      "fields": ["*"]
    }
  ]
}
```

* perform an export

```
$ node index.js export -t templates/products_export.json -n myexport -o export1.zip
```



## Parameters

---
|  paramater | alias  | notes  |   |   |
|---|---|---|---|---|
| command  |   | only valid command is export (import to comming soon)  |   |   |
| template | t  | location of import or export template  |   |   |
| output  | o  | location to  place output zip  |   |   |
| name | n | name to lable the import or export job

