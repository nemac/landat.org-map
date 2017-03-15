/**
 * Parses a config file. Since the process to get external files
 * uses AJAX you need to pass a callback to handle the next steps
 * of using the config file, since we do not know how long it
 * will take to grab the file.
 */
function ParseConfig (configFile, callback) {
    GetConfig(configFile, callback);
}

function GetConfig (configFile, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        console.log("sup")
        console.log(xmlhttp)
        if (xmlhttp.readyState == 4) {
            try {
                var data = JSON.parse(xmlhttp.responseText);
                console.log(data)
            } catch(err) {
                console.log("ERROR: Malformed JSON in config file.");
                console.log(err);
            }
            callback(data);
        }
    };
 
    xmlhttp.open("GET", configFile, true);
    xmlhttp.send();
    console.log("hi")
}
