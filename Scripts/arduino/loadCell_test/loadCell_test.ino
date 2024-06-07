// load cell hx711
#include <HX711.h>
// oled 1.3" i2c SH1106 128*64 libs
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

// Initialize the HX711 sensor with data pin (D3) and clock pin (D2)
// HX711 circuit wiring
const int LOADCELL_DOUT_PIN = 3;
const int LOADCELL_SCK_PIN = 2;
bool LOADCELL_CALIBRATED = false;
#define LOADCELL_VIN 4

HX711 scale;

// OLED init
#define i2c_Address 0x3c //initialize with the I2C addr 0x3C Typically eBay OLED's
#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET -1   //   QT-PY / XIAO
Adafruit_SH1106G display = Adafruit_SH1106G(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define XPOS 0
#define YPOS 1
#define DELTAY 2

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  // turn on Load Cell
  turnOnLoadCell();
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  // you need to wait for the sensor to be ready and wait for the OLED to power up
  delay(500);

  display.begin(i2c_Address, true); // Address 0x3C default
  //display.setContrast (0); // dim display

  display.display();
  delay(2000);
  // Clear the buffer.
  display.clearDisplay();
  //sensor.sleepMode(true);   // Turn off the sensor
  //sensor.sleepMode(false);  // Turn on the sensor
  
  calibrateLoadCell();
}

void loop() {
  // put your main code here, to run repeatedly:
  // Read only when data is available!
  if (scale.is_ready() && LOADCELL_CALIBRATED) {
    // Read the data from the sensor
    const int sensorRead = scale.get_units(10);
    Serial.println("Weight: " + String(sensorRead) + " g");
    displayText("Weight: " + String(sensorRead) + " g");
  }
//  delay(100);
}
void turnOnLoadCell(void) {
  // turn on sensor by setting pin 4 to high
  pinMode(LOADCELL_VIN, OUTPUT);
  digitalWrite(LOADCELL_VIN, HIGH);
}
void calibrateLoadCell() {
  if (scale.is_ready()) {
    scale.set_scale();
    Serial.println("Tare... remove any weights from the scale.");
    delay(5000);
    scale.tare();
    Serial.println("Tare done...");
    Serial.println("Place a known weight on the scale and enter the weight in grams:");

    // Wait for the user to enter the known weight
    while (!Serial.available()) {
      // Do nothing, just wait
    }
    String weightStr = Serial.readStringUntil('\n');
    float knownWeight = weightStr.toFloat();

    Serial.print("Using known weight: ");
    Serial.println(knownWeight);
    delay(5000);

    long reading = scale.get_units(10);
    Serial.print("Result: ");
    Serial.println(reading);

    float calibrationFactor = reading / knownWeight;
    Serial.print("Calibration factor is: ");
    Serial.println(calibrationFactor);

    scale.set_scale(calibrationFactor); // Set the new calibration factor
    LOADCELL_CALIBRATED = true;
  }
  else {
    Serial.println("HX711 not found.");
  }
  delay(1000);
}
void drawchar(void) {
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);

  for (uint8_t i = 0; i < 168; i++) {
    if (i == '\n') continue;
    display.write(i);
    if ((i > 0) && (i % 21 == 0))
      display.println();
  }
  display.display();
  delay(1);
}

void displayText(const String& text) {
  // text display tests
  display.setTextSize(1);
  display.setTextColor(SH110X_WHITE);
  display.setCursor(0, 0);
  display.println(text);
  // display.setTextColor(SH110X_BLACK, SH110X_WHITE); // 'inverted' text
  // display.println(3.141592);
  // display.setTextSize(2);
  // display.setTextColor(SH110X_WHITE);
  // display.print("0x"); display.println(0xDEADBEEF, HEX);
  display.display();
  display.clearDisplay();
}
