var addFunction = function(number1, number2) {
    console.log('addFunction() is called');
    return number1 + number2;
}

var multiplyFunction = function(number1, number2) {
    console.log('multiplyFunction() is called');
    dummyFunction(number1);
    return number1 * number2;
}

var dummyFunction = function(number1) {
    console.log('I am doing nothing here', number1);
}

var addFunction = function(number1, number2) {
    console.log('addFunction() is over-written');
    return number1 + number2;
}

module.exports = {
    "addFunction": addFunction,
    "multiplyFunction": multiplyFunction
    };