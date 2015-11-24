// cassini-tools by Jon Keegan 
// Twitter: @jonkeegan
// Github: https://github.com/jonkeegan
// Repo: https://github.com/jonkeegan/cassini-tools

var fs = require('fs');
var walk = require('walk');
var moment = require('moment');
var walker;

// this script will process the extracted files for each "coiss_XXXX" directory from the cassini archive:
// http://pds-imaging.jpl.nasa.gov/volumes/iss.html
// It wiil loop through all of the .LBL files and console.log() out a CSV

// Usage: "node process_coiss.js > output.csv"

var output_data = '';

// choose the fields the metadata that you want to include form the list at the bottom of this file. These are from the .LBL text files...
var fields_to_process = ['FILTER_NAME', '^IMAGE_HEADER', 'TARGET_DESC', 'SEQUENCE_ID', 'SEQUENCE_NUMBER', 'START_TIME'];

// this is where your "coiss_XXXX"  filesare stored...
var data_directory = '/your_data_directory_here/';

// call the function, and pass a "coiss" directory you want to process...
process_directory('coiss_2001');

// or put in a loop. This will process coiss_2001 - 2093

// for(var i= 2001; i<= 2093; i++ ){
//     process_directory("coiss_"+i);
// }

function process_directory(theDir) {
    walker = walk.walk(data_directory+theDir, {
        followLinks: false
    });
    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        var suffix = stat['name'].split(".");
        if (suffix[1] == 'LBL') {
            //console.log(root);
            var input = fs.createReadStream(root + '/' + stat['name']);
            var this_file = readLines(input, data_directory + theDir + stat['name'], root);
        }
        next();
    });
   
}

function readLines(input, the_file, parent_dir, full_path) { //var this_data = {};
    // var this_data = {};
    var this_data = '';
  //  this_data += parent_dir+ ";";
    this_data += parent_dir+ ";";
    var remaining = '';
    var line_number = 0;
    input.on('data', function(data) {
        remaining += data;
        var index = remaining.indexOf('\n');
        while (index > -1 && line_number < 84) {
            var line = remaining.substring(0, index);

            // separate the keys and the values....
            var the_key = line.split(" = ")[0];
            var the_val = line.split(" = ")[1];
           
           // only process the fields we entered in fields_to_process
            if (fields_to_process.indexOf(the_key) != -1) {
                var pre_clean = the_val.replace(/"/g, "");
                pre_clean = pre_clean.replace(/"/g, "\r");

                // This bit handles some special cases, where we want to grab some info from a value, and process it...

                if (the_key == '^IMAGE_HEADER') { // grab the image id form the file...Format: N1455008708_1.IMG
                    var this_image_id = the_val.split('"')[1].split(".")[0];
                    this_data += the_val.split('"')[1].split(".")[0] + ";";
               
                } else if (the_key == 'START_TIME') {    //  This is UTC time on the spacecraft when the image was taken...Format: 2010-083T06:53:52.745
                    var date_string = pre_clean.replace("\r", "");
                    var this_year = date_string.split('-')[0];
                    var this_day_of_year = date_string.split('-')[1].split("T")[0];

                    // let's make this time a little easier to use...
                    var timestamp_nice = moment().dayOfYear(this_day_of_year).format("MMMM D, "+this_year); 
                    var timestamp_db = this_year+"-"+moment().dayOfYear(this_day_of_year).format("MM")+"-"+moment().dayOfYear(this_day_of_year).format("DD"); 
                    this_data +=  date_string+";"+timestamp_nice+";"+timestamp_db+ ";";
                } else {
                    this_data += pre_clean.replace("\r", "")+ ";";
                }
            }
            remaining = remaining.substring(index + 1);
            index = remaining.indexOf('\n');
            line_number++;
        }
        console.log(this_data);
    });

    if(this_data != undefined){
        return this_data;
    }
}

