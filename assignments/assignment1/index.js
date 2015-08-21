var fileHandler = require('./fileHandler.js') ('/home/rahulse/Desktop/Dk');


fileHandler.resolvePath(function(err) {
    if (err) {
        console.log(err);
        return;
    }
    fileHandler.moveFiles(function(err){
        if (err) {
            console.log(err);
            return;
        }
        setTimeout(function(){
            fileHandler.listImages(function(){
                fileHandler.listAudios(function(){
                    fileHandler.listVideos();
                    });
                });
            }, 2000);
        });
    });

