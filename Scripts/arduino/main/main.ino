// load cell hx711
#include <GyverHX711.h>
// oled 1.3" i2c SH1106 128*64 libs
#include <SPI.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SH110X.h>

// Initialize the HX711 sensor with data pin (D3) and clock pin (D2)
// Set the gain to 64 for channel A
GyverHX711 sensor(3, 2, HX_GAIN64_A);
// HX_GAIN128_A - channel A gain 128
// HX_GAIN32_B - channel B gain 32
// HX_GAIN64_A - channel A gain 64


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
  
  // If taring at the first startup, 
  // you need to wait for the sensor to be ready
  delay(500);
  sensor.tare();    // Zero calibration
  display.begin(i2c_Address, true); // Address 0x3C default
  //display.setContrast (0); // dim display

  display.display();
  delay(2000);
  // Clear the buffer.
  display.clearDisplay();
  //sensor.sleepMode(true);   // Turn off the sensor
  //sensor.sleepMode(false);  // Turn on the sensor
}

void loop() {
  // put your main code here, to run repeatedly:
  // Read only when data is available!
  if (sensor.available()) {
    Serial.println(sensor.read());
  }
}

void screensaver() {
  #define NUMFLAKES 5
  #define w 16
  #define h 16
  static const unsigned char PROGMEM bitmap[] =
  { B00000000, B11000000,
    B00000001, B11000000,
    B00000001, B11000000,
    B00000011, B11100000,
    B11110011, B11100000,
    B11111110, B11111000,
    B01111110, B11111111,
    B00110011, B10011111,
    B00011111, B11111100,
    B00001101, B01110000,
    B00011011, B10100000,
    B00111111, B11100000,
    B00111111, B11110000,
    B01111100, B11110000,
    B01110000, B01110000,
    B00000000, B00110000
  };
  uint8_t icons[NUMFLAKES][3];

  // initialize
  for (uint8_t f = 0; f < NUMFLAKES; f++) {
    icons[f][XPOS] = random(display.width());
    icons[f][YPOS] = 0;
    icons[f][DELTAY] = random(5) + 1;

    Serial.print("x: ");
    Serial.print(icons[f][XPOS], DEC);
    Serial.print(" y: ");
    Serial.print(icons[f][YPOS], DEC);
    Serial.print(" dy: ");
    Serial.println(icons[f][DELTAY], DEC);
  }

  while (1) {
    // draw each icon
    for (uint8_t f = 0; f < NUMFLAKES; f++) {
      display.drawBitmap(icons[f][XPOS], icons[f][YPOS], bitmap, w, h, SH110X_WHITE);
    }
    display.display();
    delay(200);

    // then erase it + move it
    for (uint8_t f = 0; f < NUMFLAKES; f++) {
      display.drawBitmap(icons[f][XPOS], icons[f][YPOS], bitmap, w, h, SH110X_BLACK);
      // move it
      icons[f][YPOS] += icons[f][DELTAY];
      // if its gone, reinit
      if (icons[f][YPOS] > display.height()) {
        icons[f][XPOS] = random(display.width());
        icons[f][YPOS] = 0;
        icons[f][DELTAY] = random(5) + 1;
      }
    }
  }
}
