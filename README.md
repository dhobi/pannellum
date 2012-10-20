Pannellum
=========

Pannellum is a lightweight, free, and open source panorama viewer for the web. This version provides panorama views without
using iframes.

For more information about usage and compatibility, please visit https://bitbucket.org/mpetroff/pannellum/
All credits goes to mpetroff.

Usage
-----

View index.html for examples.

<pre lang='xml'><?xml version="1.0" encoding="utf-8" ?>
<html>
<head>
...
<script>
new Pannellum({
    id:'panoramaOne',
    autoload:"yes",
    showFullToggle:true,
    showZoom:true,
    rotation:{
    direction:"right",
        speed:0.10
    },
    author:"Clément d’Esparbès",
    license:3
});
</script>
...
</head>

<body>
...
<img src="1_10.jpg" id="panoramaOne" width="435" height="330" title="Reception room"/>
...
</body>
</html>
</pre>

Changes
-------
* Read properties from img - Tag where possible
* Added roation feature
* Refactored pannellum to read properties from object instead uf url
