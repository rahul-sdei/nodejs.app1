var newObject = {},
 fs = require('fs'),
 path = require('path');

module.exports = function(dir) {
    newObject['resolvePath'] = function(next) {
        fs.realpath(dir, function(err, path) {
	if (err) {
            next(err);
            return;
	}
	console.log('Directory path:', path);
        
        /* Creating "images" sub-directory */
        if (!fs.existsSync(dir + '/images')) {
            console.log('Creating "images" sub-directory');
            try {
                fs.mkdirSync(dir + '/images');
            } catch(e) {
                next(e);
                return;
            }
        }
        
        /* Creating "audios" sub-directory */
        if (!fs.existsSync(dir + '/audios')) {
            console.log('Creating "audios" sub-directory');
            try {
                fs.mkdirSync(dir + '/audios');
            } catch(e) {
                next(e);
                return;
            }
        }
        
        /* Creating "videos" sub-directory*/ 
        if (!fs.existsSync(dir + '/videos')) {
            console.log('Creating "videos" sub-directory');
            try {
                fs.mkdirSync(dir + '/videos');
            } catch(e) {
                next(e);
                return;
            }
        }
        
        next(null);
        });
    }
    
    newObject['moveFiles'] = function(next) {
        fs.readdir(dir, function(err, files){
        if (err) {
            next(e);
            return;
        }
        var i = 1;
        files.forEach(function(f){
            //console.log(i, f);
            var oldPath = dir + '/' + f,
             newPath;
            switch(path.extname(f).toLowerCase()) {
                case '.jpg':
                case '.jpeg':
                case '.png':
                case '.gif':
                    var newPath = dir + '/images/' + f;
                    break;
                case '.mp3':
                case '.amr':
                    var newPath = dir + '/audios/' + f;
                    break;
                case '.mp4':
                    var newPath = dir + '/videos/' + f;
                    break;
                default:
                    return;
                    break;
            }
            
            try {
                fs.rename(oldPath, newPath, function(err){
                if (err) {
                    console.log('Error while moving file:', f);
                } else {
                    console.log('File moved successfuly:', f);
                }
                });
            } catch(e) {
                console.log('Error while moving file:', f);
            }
            
            i++;
            })
        
            next(null);
        });
    }
    
    newObject['listImages'] = function(next) {
        console.log('Listing images...');
        fs.readdir(dir + '/images', function(err, files){
        if (err) {
            return;
        }
        var i = 1;
        files.forEach(function(f){
            console.log(i, f);
            i++;
            })
        console.log("\n");
        next();
        });
    }
    
    newObject['listAudios'] = function(next) {
        console.log('Listing audios...');
        fs.readdir(dir + '/audios', function(err, files){
        if (err) {
            return;
        }
        var i = 1;
        files.forEach(function(f){
            console.log(i, f);
            i++;
            })
        console.log("\n");
        next();
        });
    }
    
    newObject['listVideos'] = function() {
        console.log('Listing videos...');
        fs.readdir(dir + '/videos', function(err, files){
        if (err) {
            return;
        }
        var i = 1;
        files.forEach(function(f){
            console.log(i, f);
            i++;
            })
        });
    }
    
    return newObject;
}