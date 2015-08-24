var newObject = {},
 fs = require('fs'),
 path = require('path');

module.exports = function(dir) {
    var newFiles = {
	'images': [],
	'audios': [],
	'videos': []
	};
    
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
    
    newObject['getNewFiles'] = function() {	
	/* find images */
	fs.readdir(dir + '/images', function(err, files){
        if (err) {
	    console.log(err);
            return;
        }
	var tmpArr = [];
	files.forEach(function(f){
	    tmpArr.push(dir + '/images/' + f);
	});
	newFiles['images'] = tmpArr;
	});
	
	/* find audios */
	fs.readdir(dir + '/audios', function(err, files){
        if (err) {
	    console.log(err);
            return;
        }
	var tmpArr = [];
	files.forEach(function(f){
	    tmpArr.push(dir + '/audios/' + f);
	});
	newFiles['audios'] = tmpArr;
	});
	
	/* find videos */
	fs.readdir(dir + '/videos', function(err, files){
        if (err) {
	    console.log(err);
            return;
        }
	var tmpArr = [];
	files.forEach(function(f){
	    tmpArr.push(dir + '/videos/' + f);
	});
	newFiles['videos'] = tmpArr;
	});
    }
    
    newObject['moveFiles'] = function(next) {
	newObject.getNewFiles();
	
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
		    newFiles['images'].push(newPath);
                    break;
                case '.mp3':
                case '.amr':
                    var newPath = dir + '/audios/' + f;
		    newFiles['audios'].push(newPath);
                    break;
                case '.mp4':
                    var newPath = dir + '/videos/' + f;
		    newFiles['videos'].push(newPath);
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
        
            next(null, newFiles);
        });
    }
    
    newObject['listFiles'] = function(files) {
        var i = 1;
        files.sort(function(a, b) {
            return fs.statSync(a).size - 
                   fs.statSync(b).size;
        });
        files.forEach(function(f){
            console.log(i, f);
            i++;
            })
        console.log("\n");
    }
    
    return newObject;
}