# cassini-tools
Here is some code to help you work with imagery and metadata from the Cassini space probe's ISS cameras. I wrote this up after building this project: http://graphics.wsj.com/saturn/

### Cassini Imaging Science Subsystem (ISS) Data User's Guide
The definitive, offical reference guide to all Casini data is here: http://pds-rings.seti.org/cassini/iss/ISS_Data_User_Guide_120703.pdf

### Requirements
This uses **Node**, **MySQL** and some standard command line tools. Extra stuff requires **ImageMagick** (http://www.imagemagick.org/).

The main tool in here is **process_coiss.js** a node script that will go through directories full of raw Cassini ISS data downloads and export a CSV file of all image metadata than can then be used to import into a database. This database can then be used to find, sort and query sequnces of Cassini images.  I've also included **cassini_ISS_metadata.sql** which is the code needed to create a MySQL table to import your CSV into. 

### Download the raw Cassini data
The raw binary images and metadata text files can be downloaded here:
http://pds-imaging.jpl.nasa.gov/volumes/iss.html

This archive is updated quarterly, so the most recent imagery won't be in here (but you can get the latest, unarchived images here: http://saturn.jpl.nasa.gov/photos/raw/?start=1)

Download all of the tar archives of Cassini data from 2004 to now from NASA. The imagery I was focused on was from Saturn, which is saved in volumes 1-93 (as of November 2015). Each volume is named like this: **coiss_20XX** with **XX** indicating which volume it represents.

So you can set up a script to pull them down like this:
```
wget "http://pds-imaging.jpl.nasa.gov/data/cassini/cassini_orbiter/coiss_2001.tar.gz"
wget "http://pds-imaging.jpl.nasa.gov/data/cassini/cassini_orbiter/coiss_2002.tar.gz"
wget "http://pds-imaging.jpl.nasa.gov/data/cassini/cassini_orbiter/coiss_2003.tar.gz"
...
```

Next, extract the archives, like this:

``` 
tar xopf coiss_2001.tar.gz
tar xopf coiss_2002.tar.gz
tar xopf coiss_2003.tar.gz
```

### Install node dependecies

Have npm install the node dependencies you need for this tool. In the terminal, navigate to the directory that holds this repo. Then type: 
``` npm install```

### Configure process_coiss.js
Now you have to configure the `process_coiss.js` node script. There are two main things you need to change.
```var data_directory = '/your_data_directory_here/';```
Change `your_data_directory_here` to the directory that has all of your `coiss_20XX` directories.

You also need to tell the script which `coiss` directory to process. 
```
process_directory("coiss_2001");
```

This will just process one `coiss_20XX` directory at a time. You can also uncomment the for loop below that to process a sequnce of these directories. 

If you want, you can customize the fields that are extracted from the metadata field (see below in this note for a full list). You can add them to the **fields_to_process** array:
```
var fields_to_process = ['FILTER_NAME', '^IMAGE_HEADER', 'TARGET_DESC', 'SEQUENCE_ID', 'SEQUENCE_NUMBER', 'START_TIME'];
```

### Run the script

This will run through the specificed "coiss_20XX" directories, and export a CSV
```node process_coiss.js > output.csv```

### Create and populate database

Make your MySQL table
```
DROP TABLE IF EXISTS 'cassini_ISS_metadata';

CREATE TABLE 'cassini_ISS_metadata' (
  'id' int(11) unsigned NOT NULL AUTO_INCREMENT,
  'full_path' varchar(255) DEFAULT NULL,
  'image_id' varchar(255) DEFAULT NULL,
  'filters' varchar(255) DEFAULT NULL,
  'series_id' varchar(255) DEFAULT NULL,
  'series_number' int(11) DEFAULT NULL,
  'image_time' varchar(255) DEFAULT NULL,
  'target' varchar(255) DEFAULT NULL,
  'adjusted_ts' date DEFAULT NULL,
  'clean_date' varchar(255) DEFAULT NULL,
  PRIMARY KEY ('id')
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```
Then import the CSV (any way you are most comfortable, such a phpMyAdmin, Sqeuel Pro, etc)

### Convert the raw binary data to images you can use

This part stinks. For me it was just a pain, beacuse I'm on a Mac, and had to use a VM to run this utility. I wanted to use the highest resolution (1024x1024) images, so I took all of the files (.IMG and .LBL files), and copied them all to a single directory (I actually made a series of smaller directories as it took so long to process). Then I generated PNGs of each image using the Windows command line utility **IMG2PNG** (http://www.mmedia.is/bjj/utils/img2png/). It actually reads the metadata for each image, and uses that data to convert the raw image data to a PNG. So ***IMG2PNG*** is great, but a bit of a hoop to jump through if you are on a Mac. Anyone want to write a Unix / Linux port of it? Please?

Alternatively, there are some other images that you can use right off the bat. 

You will find a 256x256 8-bit greyscale version of each image in this location: 
```
coiss_20XX/extras/browse/XXXXXXXX_XXXXXXXXX/
```
Also, there are 50x50 thumbnails here: 
```
coiss_20XX/extras/thumbnail/XXXXXXXX_XXXXXXXXX/
```
And around volume 25 (coiss_25), NASA started including a collection of 16-bit greyscale TIFF files at 1024x1024 here:
```
coiss_20XX/extras/tiff/XXXXXXXX_XXXXXXXXX/
```
These contain an enormous amount of data, and are great for experimenting with different exposures to pull out important details. BUT – many of these TIFFs appear black when you open them. You need to convert them to 8-bit greyscale and adjust their levels to see correctly balanced images (though this destroys a lot of the information that the 16-bit version has).


## Other cool info

Once you have your images converted, you can do lots of cool stuff. 

If you want to make beautiful color images from Cassini, first, go read this great overview of how to do this in Photoshop, as it basically covers the same concept: http://www.planetary.org/explore/space-topics/space-imaging/tutorial_rgb_ps.html 

Using ImageMagick, and your handy new database, you can find cool sequnces of images, where they capture photos in red, green then blue. 

Here's such a filter sequence I found:

|image_id|filters|series_id|series_number|image_time|
|---|---|---|---|---|
|269090|W1731454012_1|(CL1,BL1)|S76|17|2012-317T22:33:20.558|Titan|2012-11-13|
|269098|W1731454045_1|(CL1,GRN)|S76|18|2012-317T22:33:53.768|Titan|2012-11-13|
|269106|W1731454078_1|(CL1,RED)|S76|19|2012-317T22:34:26.782|Titan|2012-11-13|

CL1 and CL2 are clear, so that sequnce is blue, green, red.

You can then combine those images in imagemagick to make a composite color image, assigning each image to it's appropraite RGB channel. 

```convert red_W1731454078_1.jpeg green_W1731454045_1.jpeg blue_W1731454012_1.jpeg -combine rgb_combined.jpg```

Keep an eye on how large the interval is between images, as the closer the better. You will often see the images moving significantly, which will make for pretty misaligned images. Doing this by hand in Photoshop is more often than not the best way to make color images, but this way is cooler. 

COLOR FILTERS KEY FROM HERE: http://saturn.jpl.nasa.gov/faq/FAQRawImages/
### Narrow Angle Filter Wheel 1

|Code|Filter color|
|---|---|
|CL1|Clear|
|RED|Red|
|BL1|Blue band 1|
|UV2|Ultraviolet band 2|
|UV1|Ultraviolet band 1|
|IRP0|Infrared 0º polarizer|
|P120|120º polarizer|
|P60|60º polarizer|
|P0|0º polarizer|
|HAL|Hydrogen Alpha|
|IR4|Infrared band 4|
|IR2|Infrared band 2|


### Narrow Angle Filter Wheel 2

|Code|Filter color|
|---|---|
|CL2|Clear|
|GRN|Green|
|UV3|Ultraviolet band 3|
|BL2|Blue band 2|
|MT2|Methane band 2|
|CB2|Continuum band 2|
|MT3|Methane band 3|
|CB3|Continuum band 3|
|MT1|Methane band 1|
|CB1|Continuum band 1|
|IR3|Infrared band 3|
|IR1|Infrared band 1|


The Wide Angle camera has nine filters per wheel.

### Wide Angle Filter Wheel 1

|Code|Filter color|
|---|---|
|CL1|Clear|
|IR3|Infrared band 3|
|IR4|Infrared band 4|
|IR5|Infrared band 5|
|CB3|Continuum band 3|
|MT3|Methane band 3|
|CB2|Continuum band 2|
|MT2|Methane band 2|
|IR2|Infrared band 2|

### Wide Angle Filter Wheel 2

|Code|Filter color|
|---|---|
|CL2|Clear|
|RED|Red|
|GRN|Green|
|BL1|Blue band 1|
|VIO|Violet|
|HAL|Hydrogen Alpha|
|IRP90|Infrared 90º polarizer|
|IRP0|Infrared 0º polarizer|
|IR1|Infrared band 1|

Here's the full list of fields available to extract from a sample metdata file. 
```
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
```

