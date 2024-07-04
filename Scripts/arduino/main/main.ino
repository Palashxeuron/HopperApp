#include <RtcDS3231.h>
#include <SoftwareWire.h>
#include <HX711.h>
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>
#include <Arduino.h>
#include <EEPROM.h>

// Declare functions prototypes
float readCalibrationFactor();
bool wasError(const char *errorTopic = "");
String getDateTimeStr(const RtcDateTime &dt);

// Initialize the HX711 sensor with data pin (D3) and clock pin (D2)
// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = 3;
const int LOADCELL_SCK_PIN = 2;
float LOADCELL_CALIBRATION_FACTOR = readCalibrationFactor();
const int CALIBRATION_FACTOR_ADDR = 0; // Define EEPROM address to store the calibration factor
long CURRENT_OFFSET = 0;
float weight = 0;
int PREV_WEIGHT = 0;
bool LOADCELL_CALIBRATED = false;
bool LOADCELL_CALIBRATING = false;
bool LOADCELL_TARING = false;
bool CALIBRATION_WEIGHT_PLACED = false;
bool STREAM_WEIGHT = false;

#define LOADCELL_VIN 4
// #define DEFAULT_CALIBRATION_FACTOR 7050
HX711 scale;

// RTC DS3231
#define RTC_VIN 13
// Define new SDA and SCL pins for Software I2C
const int RTC_SDA = 11;
const int RTC_SCL = 12;
SoftwareWire rtcWire(RTC_SDA, RTC_SCL);
RtcDS3231<SoftwareWire> Rtc(rtcWire);
#define rtcAddress 0x68
#define countof(a) (sizeof(a) / sizeof(a[0]))
float RTC_TEMP;
String RTC_DATE_TIME_STR;

// OLED init oled 1.3" i2c SH1106 128*64 libs
#define i2c_Address 0x3c // initialize with the I2C addr 0x3C Typically eBay OLED's
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET -1    //   QT-PY / XIAO
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define XPOS 0
#define YPOS 1
#define DELTAY 2

const int TRIGGER_PIN = 5;
struct HomePageState
{
  float weight = 0;
  bool isCalibrated = false;
  bool isCalibrating = false;
  bool isTare = false;
  bool isTareing = false;
  bool blutoothConnected = false;
  bool blutoothAvailable = false;
  bool isSleeping = false;
  String units = "gms";
  String DateTime = "";
  String instructions = "";
};
HomePageState homePageState;
// 'bluetooth-searching', 24x24px
const unsigned char bmp_bluetooth_searching[] PROGMEM = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x60, 0x00, 0x00, 0x78, 0x00, 0x08,
    0x78, 0x00, 0x1c, 0x6e, 0x00, 0x0e, 0x66, 0x10, 0x07, 0x6e, 0x30, 0x03, 0xfc, 0x18, 0x01, 0xf8,
    0x98, 0x00, 0xf1, 0x98, 0x00, 0xf1, 0x98, 0x01, 0xf8, 0x98, 0x03, 0xfc, 0x18, 0x07, 0x6e, 0x30,
    0x0e, 0x66, 0x10, 0x1c, 0x6e, 0x00, 0x08, 0x78, 0x00, 0x00, 0x78, 0x00, 0x00, 0x60, 0x00, 0x00,
    0x60, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
// 'bluetooth-transfer', 24x24px
const unsigned char bmp_bluetooth_transfer[] PROGMEM = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xc0, 0x00, 0x00, 0xc0, 0x00, 0x00, 0xf0, 0x00, 0x10,
    0xf0, 0x30, 0x38, 0xdc, 0x78, 0x1c, 0xcc, 0xfc, 0x0e, 0xdc, 0x30, 0x07, 0xf8, 0x30, 0x03, 0xf0,
    0x30, 0x01, 0xe0, 0x00, 0x01, 0xe0, 0x00, 0x03, 0xf0, 0x30, 0x07, 0xf8, 0x30, 0x0e, 0xdc, 0x30,
    0x1c, 0xcc, 0xfc, 0x38, 0xdc, 0x78, 0x10, 0xf0, 0x30, 0x00, 0xf0, 0x00, 0x00, 0xc0, 0x00, 0x00,
    0xc0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
// 'bluetooth-connected', 24x24px
const unsigned char bmp_bluetooth_connected[] PROGMEM = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x00, 0x18, 0x00, 0x00, 0x1e, 0x00, 0x02,
    0x1e, 0x00, 0x07, 0x1b, 0x80, 0x03, 0x99, 0x80, 0x01, 0xdb, 0x80, 0x00, 0xff, 0x00, 0x08, 0x7e,
    0x20, 0x0e, 0x3c, 0x38, 0x1c, 0x3c, 0x70, 0x04, 0x7e, 0x10, 0x00, 0xff, 0x00, 0x01, 0xdb, 0x80,
    0x03, 0x99, 0x80, 0x07, 0x1b, 0x80, 0x02, 0x1e, 0x00, 0x00, 0x1e, 0x00, 0x00, 0x18, 0x00, 0x00,
    0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
// 'bluetooth', 24x24px
const unsigned char bmp_bluetooth[] PROGMEM = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x00, 0x18, 0x00, 0x00, 0x1e, 0x00, 0x02,
    0x1e, 0x00, 0x07, 0x1b, 0x80, 0x03, 0x99, 0x80, 0x01, 0xdb, 0x80, 0x00, 0xff, 0x00, 0x00, 0x7e,
    0x00, 0x00, 0x3c, 0x00, 0x00, 0x3c, 0x00, 0x00, 0x7e, 0x00, 0x00, 0xff, 0x00, 0x01, 0xdb, 0x80,
    0x03, 0x99, 0x80, 0x07, 0x1b, 0x80, 0x02, 0x1e, 0x00, 0x00, 0x1e, 0x00, 0x00, 0x18, 0x00, 0x00,
    0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
// 'bluetooth-off', 24x24px
const unsigned char bmp_bluetooth_off[] PROGMEM = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x00, 0x00, 0x18, 0x00, 0x04, 0x1e, 0x00, 0x0e,
    0x1e, 0x00, 0x07, 0x1b, 0x80, 0x03, 0x99, 0x80, 0x01, 0xc3, 0x80, 0x00, 0xe7, 0x00, 0x00, 0x70,
    0x00, 0x00, 0x38, 0x00, 0x00, 0x3c, 0x00, 0x00, 0x7e, 0x00, 0x00, 0xff, 0x00, 0x01, 0xdb, 0x80,
    0x03, 0x99, 0xc0, 0x07, 0x1b, 0xe0, 0x02, 0x1e, 0x70, 0x00, 0x1e, 0x20, 0x00, 0x18, 0x00, 0x00,
    0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};

// Array of all bitmaps for convenience. (Total bytes used to store images in PROGMEM = 240)
const int bmp_allArray_LEN = 5;
const unsigned char *bmp_allArray[5] = {
    bmp_bluetooth,
    bmp_bluetooth_connected,
    bmp_bluetooth_off,
    bmp_bluetooth_searching,
    bmp_bluetooth_transfer};

String startMarker_Ard = "arduino:";
String endMarker_Ard = ":oniudra";
String startMarker_Esp = "esp32:";
String endMarker_Esp = ":23pse";
bool DEBUG = false;
bool connected = false;

void setup()
{
  // put your setup code here, to run once:
  Serial.begin(9600);
  Serial1.begin(9600); // to esp32
  // turn on Load Cell
  turnOnRTC();
  log("RTC turned on");
  turnOnLoadCell();
  log("LoadCell turned on");
  // turn on display
  turnOnDisplay();
  // init homePage;
  initHomePage();
  delay(1);
}

void loop()
{
  // put your main code here, to run repeatedly:
  readRtc();      // read from rtc
  readLoadCell(); // read from load cell
  readEsp();      // read from esp32
  readSerial();   // read from serial monitor
  updateScreen();
}

void turnOnRTC()
{
  // Wire.begin(RTC_SDA_pin, RTC_SCL_pin);
  pinMode(RTC_VIN, OUTPUT);
  digitalWrite(RTC_VIN, HIGH);
  delay(100);
  Rtc.Begin();

  RtcDateTime compiled = RtcDateTime(__DATE__, __TIME__);
  RTC_DATE_TIME_STR = getDateTimeStr(compiled);
  log("compiled: " + RTC_DATE_TIME_STR);

  if (!Rtc.IsDateTimeValid())
  {
    if (!wasError("setup IsDateTimeValid"))
    {
      // Common Causes:
      //    1) first time you ran and the device wasn't running yet
      //    2) the battery on the device is low or even missing

      log("RTC lost confidence in the DateTime!");

      // following line sets the RTC to the date & time this sketch was compiled
      // it will also reset the valid flag internally unless the Rtc device is
      // having an issue

      Rtc.SetDateTime(compiled);
    }
  }

  if (!Rtc.GetIsRunning())
  {
    if (!wasError("setup GetIsRunning"))
    {
      log("RTC was not actively running, starting now");
      Rtc.SetIsRunning(true);
    }
  }

  RtcDateTime now = Rtc.GetDateTime();
  if (!wasError("setup GetDateTime"))
  {
    if (now < compiled)
    {
      log("RTC is older than compile time, updating DateTime");
      Rtc.SetDateTime(compiled);
    }
    else if (now > compiled)
    {
      log("RTC is newer than compile time, this is expected");
    }
    else if (now == compiled)
    {
      log("RTC is the same as compile time, while not expected all is still fine");
    }
  }

  // never assume the Rtc was last configured by you, so
  // just clear them to your needed state
  Rtc.Enable32kHzPin(false);
  wasError("setup Enable32kHzPin");
  Rtc.SetSquareWavePin(DS3231SquareWavePin_ModeNone);
  wasError("setup SetSquareWavePin");
}
void turnOnDisplay()
{
  display.begin(i2c_Address, true); // Address 0x3C default
  // display.setContrast (0); // dim display

  display.display();
  delay(2000);
  // Clear the buffer.
  display.clearDisplay();
  // sensor.sleepMode(true);   // Turn off the sensor
  // sensor.sleepMode(false);  // Turn on the sensor
  //  display.drawBitmap(30, 16,  epd_bitmap_IMG_0607__Edited_, 32, 32, 1);
  display.display();
}
void turnOnLoadCell()
{
  // turn on sensor by setting pin 4 to high
  pinMode(LOADCELL_VIN, OUTPUT);
  digitalWrite(LOADCELL_VIN, HIGH);
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  // you need to wait for the sensor to be ready and wait for the OLED to power up
  delay(500);
  if (scale.is_ready())
  {
    if (isValidFloat(LOADCELL_CALIBRATION_FACTOR))
    {
      scale.set_scale(LOADCELL_CALIBRATION_FACTOR);
      scale.tare();
      LOADCELL_CALIBRATED = true;
      log("calibration done, calibration factor: " + String(LOADCELL_CALIBRATION_FACTOR));
    }
    else
    {
      log("not set: calibration factor not set");
      LOADCELL_CALIBRATED = false;
    }
  }
  else
  {
    log("HX711 not found." + scale.is_ready());
  }
}
void calibrateLoadCell(float calibrationFactor)
{
  setScaleCalibrationFactor(calibrationFactor); // Set the new calibration factor
  long reading = scale.get_units(10);
  log("Result: " + String(reading) + " g");
  sendToESP32("ACK: calibrated using: " + String(calibrationFactor) + ";Result: " + String(reading) + " g");
}

void initHomePage()
{
  log("initHomePage");
  homePageState.blutoothConnected = connected;
  homePageState.DateTime = RTC_DATE_TIME_STR;
  homePageState.isCalibrating = LOADCELL_CALIBRATING;
  homePageState.isTareing = LOADCELL_TARING;
  homePageState.isCalibrated = LOADCELL_CALIBRATED;
  homePageState.weight = weight;
  homePageState.units = "g";
  drawHomePage(homePageState);
}

void readRtc()
{
  if (!Rtc.IsDateTimeValid())
  {
    if (!wasError("loop IsDateTimeValid"))
    {
      // Common Causes:
      //    1) the battery on the device is low or even missing and the power line was disconnected
      log("RTC lost confidence in the DateTime!");
    }
  }

  RtcDateTime now = Rtc.GetDateTime();
  if (!wasError("loop GetDateTime"))
  {
    RTC_DATE_TIME_STR = getDateTimeStr(now);
    log(RTC_DATE_TIME_STR);
  }

  RtcTemperature temp = Rtc.GetTemperature();
  if (!wasError("loop GetTemperature"))
  {
    RTC_TEMP = temp.AsFloatDegC();
    log(String(RTC_TEMP) + " C");
  }
}
void readLoadCell()
{
  // Read only when data is available!
  if (scale.is_ready())
  {
    // Read the data from the sensor
    const int sensorRead = scale.get_units(10);
    weight = sensorRead;
    if(weight >= 1000){
      weight = weight/1000;
      homePageState.units = "kg";
    }
    String str = "WEIGHT: " + String(sensorRead) + " g" + ";TIME: " + RTC_DATE_TIME_STR;
    log(str);
    if (connected && STREAM_WEIGHT)
    {
      sendToESP32(str);
    }
  }
}
void readEsp() // read from esp32
{
  String str = "";
  while (Serial1.available())
  {
    char c = Serial1.read();
    str += c;
  }
  handleEsp32Request(str);
}
void readSerial() // read from serial monitor
{
  if (Serial.available())
  {
    // read serial data and convert to string
    String data = Serial.readStringUntil('\n');
    // log(data);
    sendToESP32(data);
    data.trim();
    if (data == "pw")
    {
      CALIBRATION_WEIGHT_PLACED = true;
    }
  }
}

void handleEsp32Request(String data)
{
  if (isEspMessage(data)) // check if data contains the start and end marker
  {
    String request = extractEspMessage(data);
    if (request == "Are you Smart-Scale")
    {
      log("ACK: Yes, I am Smart-Scale");
      sendToESP32("ACK: Yes, I am Smart-Scale");
      connected = true;
    }
    if (request == "connect")
    {
      connected = true;
      sendToESP32("ACK: connect");
    }
    if (request == "still connected")
    {
      connected = true;
      sendToESP32("ACK: still connected");
    }
    if (request == "disconnect")
    {
      connected = false;
      STREAM_WEIGHT = false;
      sendToESP32("ACK: disconnect");
    }
    if (request == "getWeight")
    {
      readLoadCell(); // will send one reading to esp32
    }
    if (request == "start sending weights")
    {
      STREAM_WEIGHT = true;
      sendToESP32("ACK: start sending weights");
    }
    if (request == "stop sending weights")
    {
      STREAM_WEIGHT = false;
      sendToESP32("ACK: stop sending weights");
    }
    if (request == "tare")
    {
      LOADCELL_TARING = true;
      scale.tare();
      sendToESP32("ACK: tarred");
      LOADCELL_TARING = false;
    }
    if (request.indexOf("calibrate") >= 0)
    {
      float factor = getCalibrationFactor(request);
      calibrateLoadCell(factor);
    }
    if (request == "placed weight")
    {
      CALIBRATION_WEIGHT_PLACED = true;
    }
  }
}
void sendToESP32(String data)
{
  Serial1.println(" " + startMarker_Ard + data + endMarker_Ard);
}
bool isEspMessage(String data)
{
  return data.indexOf(startMarker_Esp) >= 0 && data.indexOf(endMarker_Esp) >= 0;
}
String extractEspMessage(String data)
{
  // get string between $$# and #$$
  int startIndex = data.indexOf(startMarker_Esp) + startMarker_Esp.length();
  int endIndex = data.indexOf(endMarker_Esp);
  return data.substring(startIndex, endIndex);
}

void drawHomePage(const HomePageState &state)
{
  // log("drawHomePage");
  // Clear the display
  display.clearDisplay();

  // Draw top bar with Bluetooth icon, time, and date
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);

  // Draw Bluetooth icon
  if (connected)
  {
    display.drawBitmap(0, 10, bmp_bluetooth_connected, 24, 24, SH110X_WHITE);
  }
  else if (connected && STREAM_WEIGHT)
  {
    display.drawBitmap(0, 10, bmp_bluetooth_transfer, 24, 24, SH110X_WHITE);
  }
  else
  {
    display.drawBitmap(0, 10, bmp_bluetooth_off, 24, 24, SH110X_WHITE);
  }
  // Draw time and date
  display.setCursor(0, 0);
  display.print(state.DateTime.substring(11, 19)); // Display only time
  display.setCursor(65, 0);
  display.print(state.DateTime.substring(0, 10)); // Display only date
  if (state.instructions != "")
  {
    display.setCursor(20, 10);
    display.print(state.instructions);
  }
  // Draw calibration and tare information
  if (state.isCalibrating)
  {
    display.setTextSize(1);
    display.setTextColor(SH110X_WHITE);
    display.setCursor(40, 20);
    display.println("Calibrating...");
  }
  else if (state.isTareing)
  {
    display.setTextSize(1);
    display.setTextColor(SH110X_WHITE);
    display.setCursor(50, 20);
    display.println("Taring...");
  }

  // Draw weight information
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 40);
  display.print("Weight: ");
  display.print(state.weight);
  display.print(" ");
  display.println(state.units);

  // // Draw additional information
  // display.setTextSize(1);
  // display.setCursor(0, 55);
  // display.print("Calibrated: ");
  // display.println(state.isCalibrated ? "Yes" : "No");

  // display.setCursor(0, 50);
  // display.print("Sleeping: ");
  // display.println(state.isSleeping ? "Yes" : "No");

  // Display the content on the OLED
  display.display();
}
void drawChar(void)
{
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);

  for (uint8_t i = 0; i < 168; i++)
  {
    if (i == '\n')
      continue;
    display.write(i);
    if ((i > 0) && (i % 21 == 0))
      display.println();
  }
  display.display();
  delay(1);
}
void displayText(const String &text, const int x, const int y)
{
  // text display tests
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(x, y);
  display.println(text);
  // display.setTextColor(SH110X_BLACK, SH110X_WHITE); // 'inverted' text
  // display.println(3.141592);
  // display.setTextSize(2);
  // display.setTextColor(SH110X_WHITE);
  // display.print("0x"); display.println(0xDEADBEEF, HEX);
}
void updateScreen()
{
  // log("updateScreen");
  // // Clear the display
  // display.clearDisplay();
  // // Draw the bitmap
  // // display.drawBitmap(0, 0, bitmap_bluetooth, 48, 48, SH110X_WHITE);
  // displayText("Weight: " + String(weight) + " g", 0, 0);
  // displayText("master: " + String(connected ? "connected" : "disconnected"), 0, 20);
  // // Display the content on the OLED
  // display.display();
  homePageState.blutoothConnected = connected;
  homePageState.DateTime = RTC_DATE_TIME_STR;
  homePageState.isCalibrating = LOADCELL_CALIBRATING;
  homePageState.isTareing = LOADCELL_TARING;
  homePageState.isCalibrated = LOADCELL_CALIBRATED;
  homePageState.weight = weight;
  drawHomePage(homePageState);
}

int getCalibrationWeight(String request)
{
  // extract value from string calibrate:100
  int startIndex = request.indexOf(":") + 1;
  int endIndex = request.length();
  String value = request.substring(startIndex, endIndex);
  return value.toInt();
}
float getCalibrationFactor(String request)
{
  // extract value from string calibrate:100
  int startIndex = request.indexOf(":") + 1;
  int endIndex = request.length();
  String value = request.substring(startIndex, endIndex);
  return value.toFloat();
}
void writeCalibrationFactor(float calibrationFactor)
{
  // write calibration factor to EEPROM
  EEPROM.put(CALIBRATION_FACTOR_ADDR, calibrationFactor);
  log("Calibration factor written to EEPROM: " + String(EEPROM.get(CALIBRATION_FACTOR_ADDR, calibrationFactor)));
}
float readCalibrationFactor()
{
  // read calibration factor from EEPROM
  float calibrationFactor;
  EEPROM.get(CALIBRATION_FACTOR_ADDR, calibrationFactor);
  log("Calibration factor: " + String(calibrationFactor));
  return calibrationFactor;
}
void setScaleCalibrationFactor(float calibrationFactor)
{
  scale.set_scale(calibrationFactor);
  LOADCELL_CALIBRATION_FACTOR = calibrationFactor;
  writeCalibrationFactor(calibrationFactor);
  sendToESP32("ACK: calibration done, calibration factor: " + String(calibrationFactor));
}

bool isValidFloat(float value)
{
  // Example check: Ensure the value is within a specific range
  // This is just an example and the actual validation logic will depend on your application's requirements
  return value > 0.0 && value < 10000.0;
}
String getDateTimeStr(const RtcDateTime &dt)
{
  char dateString[26];

  snprintf_P(dateString,
             countof(dateString),
             PSTR("%02u/%02u/%04u %02u:%02u:%02u"),
             dt.Month(),
             dt.Day(),
             dt.Year(),
             dt.Hour(),
             dt.Minute(),
             dt.Second());
  return dateString;
}
bool wasError(const char *errorTopic = "")
{
  // handy routine to return true if there was an error
  // but it will also print out an error message with the given topic
  uint8_t error = Rtc.LastError();
  if (error != 0)
  {
    // we have a communications error
    // see https://www.arduino.cc/reference/en/language/functions/communication/wire/endtransmission/
    // for what the number means
    Serial.print("[");
    Serial.print(errorTopic);
    Serial.print("] WIRE communications error (");
    Serial.print(error);
    Serial.print(") : ");

    switch (error)
    {
    case Rtc_Wire_Error_None:
      Serial.println("(none?!)");
      break;
    case Rtc_Wire_Error_TxBufferOverflow:
      Serial.println("transmit buffer overflow");
      break;
    case Rtc_Wire_Error_NoAddressableDevice:
      Serial.println("no device responded");
      break;
    case Rtc_Wire_Error_UnsupportedRequest:
      Serial.println("device doesn't support request");
      break;
    case Rtc_Wire_Error_Unspecific:
      Serial.println("unspecified error");
      break;
    case Rtc_Wire_Error_CommunicationTimeout:
      Serial.println("communications timed out");
      break;
    }
    return true;
  }
  return false;
}
void log(String data)
{
  if (DEBUG)
  {
    Serial.println(data);
  }
}