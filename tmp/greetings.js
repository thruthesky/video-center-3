var greetings = {};
exports = module.exports = greetings;
greetings.count = 0;
greetings.sayHi = function (a) {
    this.count ++;
    return "Hi : count : " + this.count + " : " + a;
};
greetings.sayHello = function(b) {
    this.count ++;
    return "Hello : count : " + this.count + " : " + b;
};

