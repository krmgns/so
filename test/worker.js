// thanks: http://www.briangrinstead.com/blog/filereadersync
var _self = self;
var re_data = /^data:(?:.+);base64,/;
var message;
_self.onmessage = function(e) {
    try {
        message = new FileReaderSync().readAsDataURL(e.data.file);
        if (!re_data.test(message)) {
            // convert etc..
        }
    } catch(e) {}

    _self.postMessage(message);
};


// @usage
// var worker = new Worker('worker.js');
// worker.onmessage = function(e) {
//     log(e.data);
// };
// $.for(file.files, function(file) {
//     worker.postMessage({file: file});
// });
