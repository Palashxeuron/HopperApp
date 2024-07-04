#include "HX711.h"
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <nRF24L01.h>
#include "printf.h"
#include <RF24.h>
#include <RF24_config.h>
#include <math.h>
#include <EEPROM.h>


#define LB2KG  0.45352
#define CALWEIGHT 3.00
#define DEFAULT_CALIFACTOR -7050


#define id 1
#define number_of_digits 1

#define DOUT  2
#define CLK 3
#define button A0

HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);
RF24 radio (4, 5);
const byte addresses[][6] = {"00001", "00002"};
long currentOffset;
float calibration_factor;


void setup() {
  //serial
  Serial.begin(115200);
  Serial.println("System started");
  printf_begin();

  // lcd
  lcd.begin();
  lcd.backlight();
  lcd.clear();
  //EEPROM.write(0x00,0xFF);
  // button pin
  pinMode(button, INPUT_PULLUP);
  
  
  
  // eeprom
  if (EEPROM.read(0x00) != 0x01) 
  {
    Serial.println("NOT INIT !!!!");
    currentOffset = 0;
    calibration_factor = DEFAULT_CALIFACTOR;     
    // show instructions
    lcd.setCursor(0, 0);
    lcd.print("MUST CALIBIRATE");
    lcd.setCursor(0, 1);
    lcd.print("Press Button");
    //wait for button press
    while (digitalRead(button));
    lcd.clear();
  }
  else
  {
    EEPROM.get(0x01,currentOffset);
    EEPROM.get(0x01+sizeof(long),calibration_factor);   
    Serial.println("currentOffset = " + String(currentOffset));
    Serial.println("calibration_factor = " + String(calibration_factor));
  }
  

  //scale
  scale.begin(DOUT, CLK);
  delay(100);
  Serial.println("calibration_factor = " + String(calibration_factor));
  scale.set_scale(calibration_factor / LB2KG);

  // if button is pressed (LOW) start calibiration
  if (!digitalRead(button))
  {
    // show instructions
    lcd.setCursor(0, 0);
    lcd.print("Clear Scale");
    // wait till person leaves the button
    while (!digitalRead(button));
    //short delay
    delay(200);
    
    // set tare and save value
    scale.tare();
    currentOffset = scale.get_offset();
    Serial.println(currentOffset);

    // show on lcd
    lcd.clear();
    lcd.print("Place 3Kg");
    lcd.setCursor(0, 1);
    lcd.print("Press Button");
    
    //wait for button press
    while (digitalRead(button));
    lcd.clear();
    lcd.print("Please wait ");
    Serial.println("calibirte");
    // calibiation
    boolean done = false;
    uint8_t flipDirCount = 0;
    int8_t direction = 1;
    uint8_t dirScale = 100;
    double data = abs(scale.get_units());
    double prevData = data;
    char runningSign[] = {'-','\\','|','/'};
    uint8_t runningSignIdx = 0;
    while (!done)
    {
      // get data
      data = abs(scale.get_units());
      Serial.println("data = " + String(data, 2));
      Serial.println("abs = " + String(abs(data - CALWEIGHT), 4));
      Serial.println("calibration_factor = " + String(calibration_factor));
      // if not match
      if (abs(data - CALWEIGHT) >= 0.01)
      {
        if (abs(data - CALWEIGHT) < abs(prevData - CALWEIGHT) && direction != 1 && data < CALWEIGHT)
        {
          direction = 1;
          flipDirCount++;
        }
        else if (abs(data - CALWEIGHT) >= abs(prevData - CALWEIGHT) && direction != -1 && data > CALWEIGHT)
        {
          direction = -1;
          flipDirCount++;
        }

        if (flipDirCount > 2)
        {
          if (dirScale != 1)
          {
            dirScale = dirScale / 10;
            flipDirCount = 0;
            Serial.println("dirScale = " + String(dirScale));
          }
        }
        // set new factor 
        calibration_factor += direction * dirScale;
        scale.set_scale(calibration_factor / LB2KG);
        // show still running 
        lcd.setCursor(15, 1);
        lcd.print(runningSign[runningSignIdx]);
        runningSignIdx = (runningSignIdx+1)%4;
        //short delay
        delay(5);
        // keep old data 
        prevData = data;
      }
      // if match
      else
      {
        Serial.println("NEW currentOffset = " + String(currentOffset));
        Serial.println("NEW calibration_factor = " + String(calibration_factor));
        EEPROM.put(0x00,0x01); // set init
        EEPROM.put(0x01,currentOffset);
        EEPROM.put(0x01+sizeof(long),calibration_factor);  
        done = true;
        lcd.clear();
      }

    } // end while
  } //end if button pressed

  scale.set_offset(currentOffset);

  lcd.setCursor(0, 0);
  lcd.print("Scaleit");
  lcd.setCursor(13, 1);
  lcd.print("KG");


  // radio
  radio.begin();
  radio.openWritingPipe(addresses[1]); // 00002
  radio.openReadingPipe(1, addresses[0]); // 00001
  radio.setPALevel(RF24_PA_MIN);
  radio.setDataRate(RF24_250KBPS);
  radio.setChannel(100);
  radio.stopListening();
  radio.printDetails();

  
  Serial.println("setup done ...");

}

void loop() {
  // get data
  double data = abs(scale.get_units());
  // issue with abs missing at the 4th digit after the dot (bug!!)
  if (0.0000 - data > 0.0001) 
    data = 0.00; //reset to zero
    
  
  // serial
  Serial.print(data, number_of_digits);
  Serial.println(" Kg");

  // lcd
  lcd.setCursor(8, 1);
  lcd.print(data, number_of_digits);



  // nrf
  double data2[2] = {id, data};
  radio.write(&data2, sizeof(data2));

  // short delay
  delay(1000);

}
