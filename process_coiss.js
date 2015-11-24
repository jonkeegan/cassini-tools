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
// It wiil loop through all of the .LBL files and console.log out a CSV

// Uasage: "node process_coiss.js > output.csv"

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

/*
COLOR FILTERS KEY FROM HERE: http://saturn.jpl.nasa.gov/faq/FAQRawImages/

The Narrow Angle camera has 12 filters per wheel.   
    
Filter Wheel 1  
CL1 Clear
RED Red
BL1 Blue band 1
UV2 Ultraviolet band 2
UV1 Ultraviolet band 1
IRP0    Infrared 0º polarizer
P120    120º polarizer
P60 60º polarizer
P0  0º polarizer
HAL Hydrogen Alpha
IR4 Infrared band 4
IR2 Infrared band 2
    
Filter Wheel 2  
CL2 Clear
GRN Green
UV3 Ultraviolet band 3
BL2 Blue band 2
MT2 Methane band 2
CB2 Continuum band 2
MT3 Methane band 3
CB3 Continuum band 3
MT1 Methane band 1
CB1 Continuum band 1
IR3 Infrared band 3
IR1 Infrared band 1
    
The Wide Angle camera has nine filters per wheel.   
    
Filter Wheel 1  
CL1 Clear
IR3 Infrared band 3
IR4 Infrared band 4
IR5 Infrared band 5
CB3 Continuum band 3
MT3 Methane band 3
CB2 Continuum band 2
MT2 Methane band 2
IR2 Infrared band 2
    
Filter Wheel 2  
CL2 Clear
RED Red
GRN Green
BL1 Blue band 1
VIO Violet
HAL Hydrogen Alpha
IRP90   Infrared 90º polarizer
IRP0    Infrared 0º polarizer
IR1 Infrared band 1

*/

/*
=== IDENTIFICATION DATA ELEMENTS ==== 
ANTIBLOOMING_STATE_FLAG = "ON"
BIAS_STRIP_MEAN = 16.935421
CALIBRATION_LAMP_STATE_FLAG = "N/A"
COMMAND_FILE_NAME = "trigger_6063_4.ioi"
COMMAND_SEQUENCE_NUMBER = 6063
DARK_STRIP_MEAN = 0.000000
DATA_CONVERSION_TYPE = "TABLE"
DATA_SET_ID = "CO-S-ISSNA/ISSWA-2-EDR-V1.0"
DELAYED_READOUT_FLAG = "NO"
DESCRIPTION = "N/A"
DETECTOR_TEMPERATURE = -89.243546 <DEGC>
EARTH_RECEIVED_START_TIME = 2004-110T14:32:47.439
EARTH_RECEIVED_STOP_TIME = 2004-110T14:34:18.462
ELECTRONICS_BIAS = 112
EXPECTED_MAXIMUM = (0.296517,0.763812)
EXPECTED_PACKETS = 335
EXPOSURE_DURATION = 18000.000000
FILTER_NAME = ("CL1","CL2")
FILTER_TEMPERATURE = -0.468354
FLIGHT_SOFTWARE_VERSION_ID = "1.3"
GAIN_MODE_ID = "12 ELECTRONS PER DN"
IMAGE_MID_TIME = 2004-109T05:52:24.872
IMAGE_NUMBER = "1460960167"
IMAGE_OBSERVATION_TYPE = {"SCIENCE"}
IMAGE_TIME = 2004-109T05:52:33.872
INSTRUMENT_DATA_RATE = 182.783997
INSTRUMENT_HOST_NAME = "CASSINI ORBITER"
INSTRUMENT_ID = "ISSNA"
INSTRUMENT_MODE_ID = "FULL"
INSTRUMENT_NAME = "IMAGING SCIENCE SUBSYSTEM NARROW ANGLE"
INST_CMPRS_PARAM = ("N/A","N/A","N/A","N/A")
INST_CMPRS_RATE = (2.300000,2.330292)
INST_CMPRS_RATIO = 3.433047
INST_CMPRS_TYPE = "LOSSLESS"
LIGHT_FLOOD_STATE_FLAG = "ON"
METHOD_DESC = "ISSPT2.5;I/F=9.00e-06@9.037AU;ISS_C44OT_APPSATSRC001_PRIME_2"
MISSING_LINES = 0
MISSING_PACKET_FLAG = "NO"
MISSION_NAME = "CASSINI-HUYGENS"
MISSION_PHASE_NAME = "APPROACH SCIENCE"
OBSERVATION_ID = "ISS_C44OT_APPSATSRC009_PRIME"
OPTICS_TEMPERATURE = (0.712693,1.905708)
ORDER_NUMBER = 1
PARALLEL_CLOCK_VOLTAGE_INDEX = 9
PREPARE_CYCLE_INDEX = 6
PRODUCT_CREATION_TIME = 2004-110T20:19:19.000
PRODUCT_ID = "1_N1460960167.118"
PRODUCT_VERSION_TYPE = "FINAL"
READOUT_CYCLE_INDEX = 10
RECEIVED_PACKETS = 340
SENSOR_HEAD_ELEC_TEMPERATURE = 1.633024
SEQUENCE_ID = "C44"
SEQUENCE_NUMBER = 13
SEQUENCE_TITLE = "--"
SHUTTER_MODE_ID = "NACONLY"
SHUTTER_STATE_ID = "ENABLED"
SOFTWARE_VERSION_ID = "ISS 9.00 02-05-2004"
SPACECRAFT_CLOCK_CNT_PARTITION = 1
SPACECRAFT_CLOCK_START_COUNT = "1460960149.118"
SPACECRAFT_CLOCK_STOP_COUNT = "1460960167.118"
START_TIME = 2004-109T05:52:15.872
STOP_TIME = 2004-109T05:52:33.872
TARGET_DESC = "Constant I/F"
TARGET_LIST = "N/A"
TARGET_NAME = "SATURN"
TELEMETRY_FORMAT_ID = "UNK"
VALID_MAXIMUM = (9896,4095)
*/

