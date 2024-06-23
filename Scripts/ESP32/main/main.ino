#include "BluetoothSerial.h"
#include "BTAddress.h"
#include "BTAdvertisedDevice.h"
#include "BTScan.h"

// Check if Bluetooth is available
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif
// Check Serial Port Profile
#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

BluetoothSerial SerialBT;

#define BT_DISCOVER_TIME 10000
esp_spp_sec_t sec_mask = ESP_SPP_SEC_NONE; // or ESP_SPP_SEC_ENCRYPT|ESP_SPP_SEC_AUTHENTICATE to request pincode confirmation
// esp_spp_sec_t sec_mask = ESP_SPP_SEC_ENCRYPT | ESP_SPP_SEC_AUTHENTICATE;
esp_spp_role_t role = ESP_SPP_ROLE_SLAVE;                         // or ESP_SPP_ROLE_MASTER
esp_bd_addr_t new_address = {0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC}; // Replace with your desired address

#define RX 16
#define TX 17
// std::map<BTAddress, BTAdvertisedDeviceSet> btDeviceList;

bool SETUP_COMPLETE = false;
bool PAIRED = false;        // paired with a master device
bool CONNECTED = false;     // connected to a paired master device
bool APP_CONNECTED = false; // connected to a paired master device
String startMarker_Ard = "arduino:";
String endMarker_Ard = ":oniudra";
String startMarker_Esp = "esp32:";
String endMarker_Esp = ":23pse";
String startMarker_Master = "master:";
String endMarker_Master = ":retsam";
String device_name = "Smart-Scale";

bool debug = true; // set to false once done developing and testing

void setup()
{
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX, TX); // connection to arduino
  initBluetooth();
  delay(1000);
}

void loop()
{
  if (SETUP_COMPLETE)
  {
    if (CONNECTED)
    {
      readSerial();
      readArduino();
      readSerialBT();
    }
  }
  else
  {
    log("Setup not complete yet. Retrying...");
    delay(1000);
    initBluetooth();
  }
  delay(20);
}

void initBluetooth()
{
  SerialBT.onAuthComplete(BT_Pairing_Callback);
  SerialBT.register_callback(Bt_Connect_Callback);
  if (!SerialBT.begin(device_name))
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

void BT_Pairing_Callback(boolean success)
{
  if (success)
  {
    PAIRED = true;
    log("Pairing success!!");
    // TODO: set discoverability for new pairing off
  }
  else
  {
    log("Pairing failed, rejected by user!!");
  }
}
void Bt_Connect_Callback(esp_spp_cb_event_t event, esp_spp_cb_param_t *param)
{

  if (event == ESP_SPP_SRV_OPEN_EVT)
  {
    log("Client Connected");
    CONNECTED = true;
    PAIRED = true; // if connected, then it is paired
    // Do stuff if connected
  }

  else if (event == ESP_SPP_CLOSE_EVT)
  {
    log("Client Disconnected");
    CONNECTED = false;
    // Do stuff if not connected
    
  }
}

void readSerial() // read from the serial monitor
{
  if (Serial.available())
  {
    String data = Serial.readStringUntil('\n');
    log("sending from serial monitor");
    sendToArduino(data);
  }
}
void readSerialBT() // read from the bluetooth
{
  String str = "";
  while (SerialBT.available())
  {
    char c = SerialBT.read();
    str += c;
  }
  if (isMasterMessage(str))
  {
    str = extractMasterMessage(str);
    log("received from app: " + str);
    sendToArduino(str);
  }
}
void readArduino() // read from the arduino
{
  String str = "";
  while (Serial2.available())
  {
    char c = Serial2.read();
    str += c;
  }
  if (isArduinoMessage(str))
  {
    str = extractArduinoMessage(str);
    if (str.indexOf("ACK:") >= 0)
    {
      sendToApp(str, "");
    }
    else
    {
      sendToApp(str, "DATA:"); // send to the bluetooth app
    }
    log("arduino: " + str); // send to the serial monitor
  }
}

void sendToArduino(String data)
{
  log("sending to arduino: " + data); // send to the serial monitor
  Serial2.println(startMarker_Esp + data + endMarker_Esp);
}
bool isArduinoMessage(String data)
{
  return data.indexOf(startMarker_Ard) >= 0 && data.indexOf(endMarker_Ard) >= 0;
}
String extractArduinoMessage(String data)
{
  // get string between $$# and #$$
  int startIndex = data.indexOf(startMarker_Ard) + startMarker_Ard.length();
  int endIndex = data.indexOf(endMarker_Ard);
  return data.substring(startIndex, endIndex);
}
bool isMasterMessage(String data)
{
  return data.indexOf(startMarker_Master) >= 0 && data.indexOf(endMarker_Master) >= 0;
}
String extractMasterMessage(String data)
{
  // get string between $$# and #$$
  int startIndex = data.indexOf(startMarker_Master) + startMarker_Master.length();
  int endIndex = data.indexOf(endMarker_Master);
  return data.substring(startIndex, endIndex);
}
void sendToApp(String data, String type = "data")
{
  SerialBT.println(type + ":" + data);
}
void log(String data)
{
  if (debug)
  {
    Serial.println(data);
  }
}