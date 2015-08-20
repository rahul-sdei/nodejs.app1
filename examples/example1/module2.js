var newObject = {};
newObject.test = function () {
    return 'export2';
}

newObject['test2'] = function() {
    return 'export2.test2';
}
module.exports = newObject;