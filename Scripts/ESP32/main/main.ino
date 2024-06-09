#include <BluetoothSerial.h>
// #include <BTAddress.h>
// #include <BTAdvertisedDevice.h>
// #include <BTScan.h>
// #include <map>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif

#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

BluetoothSerial SerialBT;

#define BT_DISCOVER_TIME 10000
esp_spp_sec_t sec_mask = ESP_SPP_SEC_NONE; // or ESP_SPP_SEC_ENCRYPT|ESP_SPP_SEC_AUTHENTICATE to request pincode confirmation
// esp_spp_sec_t sec_mask = ESP_SPP_SEC_ENCRYPT | ESP_SPP_SEC_AUTHENTICATE;
esp_spp_role_t role = ESP_SPP_ROLE_SLAVE; // or ESP_SPP_ROLE_MASTER

bool SETUP_COMPLETE = false;
#define RX 16
#define TX 17
// std::map<BTAddress, BTAdvertisedDeviceSet> btDeviceList;
bool debug = true;

void setup()
{
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX, TX);
  // init();
  if (!SerialBT.begin("Smart scale", true))
  {
    log("========== serialBT failed!");
    abort();
  }
  else
  {
    log("Bluetooth initialized");
    log("The device started, now you can pair it with Bluetooth!");
    SETUP_COMPLETE = true;
  }
  delay(1000);
}

void loop()
{
  if (SETUP_COMPLETE)
  {
    readSerial2();
    readSerialBT();
    readSerial();
  }
  else
  {
    log("Setup not complete yet. Retrying...");
    delay(1000);
    init();
  }
}
void readSerial() // read from the serial monitor
{
  if (Serial.available())
  {
    String data = Serial.readStringUntil('\n');
    sendToArduino(data);
  }
}
void readSerialBT() // read from the bluetooth
{
  if (SerialBT.available())
  {
    sendToArduino(String(SerialBT.read())); // send to the arduino
  }
}
void readSerial2() // read from the arduino - works
{
  while (Serial2.available())
  {
    char c = Serial2.read();
    SerialBT.write(c); // send to the bluetooth
    Serial.print(c);  // send to the serial monitor
  }
}

void sendToArduino(String data)
{
  // log("sending to arduino: "+data); // send to the serial monitor
  Serial2.println(data);
}

void init()
{
  if (!SerialBT.begin("Smart scale", true))
  {
    log("========== serialBT failed!");
    abort();
  }
  else
  {
    log("Bluetooth initialized");
    log("The device started, now you can pair it with Bluetooth!");
    SETUP_COMPLETE = true;
  }
}

void log(String data)
{
  if (debug)
  {
    Serial.println(data);
  }
}