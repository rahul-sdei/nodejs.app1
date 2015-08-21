var fs = require('fs');

fs.watchFile(__dirname + '/package.json', {
    "persistent": true
    }, function(curr, prev){
    console.log(curr, prev);
    });