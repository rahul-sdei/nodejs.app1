var fileHandler = require('./fileHandler.js') ('/home/rahulse/Desktop/Dk');


fileHandler.resolvePath(function(err) {
    if (err) {
        console.log(err);
        return;
    }
    fileHandler.moveFiles(function(err, newFiles){
        if (err) {
            console.log(err);
            return;
        }
        console.log('Listing images...');
        fileHandler.listFiles(newFiles['images']);
        console.log('Listing audios...');
        fileHandler.listFiles(newFiles['audios']);
        console.log('Listing videos...');
        fileHandler.listFiles(newFiles['videos']);
        });
    });

