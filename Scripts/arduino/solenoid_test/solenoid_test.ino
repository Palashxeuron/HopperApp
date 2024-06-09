#include <Arduino.h>

const int solenoidPin = 5;
const unsigned long interval = 1000;  // 1 second
const unsigned long duration = 60000; // 1 minute

void setup()
{
    pinMode(solenoidPin, OUTPUT);
    Serial.begin(9600);
}

void loop()
{
    unsigned long startTime = millis();
    while (millis() - startTime < duration)
    {
        digitalWrite(solenoidPin, HIGH); // Push solenoid
        Serial.println("Pushing solenoid");
        delay(interval);
        digitalWrite(solenoidPin, LOW); // Pull solenoid
        Serial.println("Pulling solenoid");
        
        delay(interval);
    }
}