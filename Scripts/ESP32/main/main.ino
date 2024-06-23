#include "BluetoothSerial.h"

// Prototype declaration
void sendToApp(String data, String type = "DATA");

// Check if Bluetooth is available
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif
// Check Serial Port Profile
#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

#define PAIR_MAX_DEVICES 20
int pairedDeviceCount = 0;
uint8_t pairedDeviceBtAddr[PAIR_MAX_DEVICES][6];
char bda_str[18];
BluetoothSerial SerialBT;

// #define BT_DISCOVER_TIME 10000 // 10 seconds
// esp_spp_sec_t sec_mask = ESP_SPP_SEC_NONE;                        // or ESP_SPP_SEC_ENCRYPT|ESP_SPP_SEC_AUTHENTICATE to request pincode confirmation
// esp_spp_role_t role = ESP_SPP_ROLE_SLAVE;                         // or ESP_SPP_ROLE_MASTER
// // esp_bd_addr_t new_address = {0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC}; // Replace with your desired address

#define RX 16
#define TX 17

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
    // if (CONNECTED)
    // {
    readSerial();
    readArduino();
    readSerialBT();
    // }
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
    log("The device started, now you can connect/pair it with Bluetooth!");
    listPairedDevices();
    removePairedDevices();
    SETUP_COMPLETE = true;
  }
}

void BT_Pairing_Callback(boolean success)
{
  if (success)
  {
    PAIRED = true;
    log("Pairing success!!");
    // send simple message to serialBT for creation of BT serial port on PC
    sendToApp("Pairing success!!");
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

void sendToApp(String data, String type)
{
  SerialBT.println(type + ":" + data);
}
void readSerial() // read from the serial monitor
{
  if (Serial.available())
  {
    String data = Serial.readStringUntil('\n');
    log("sending from serial monitor");
    sendToArduino(data);
    handleCommand(data);
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
      sendToApp(str, "DATA"); // send to the bluetooth app
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

void log(String data)
{
  if (debug)
  {
    Serial.println(data);
  }
}
char *bda2str(const uint8_t *bda, char *str, size_t size)
{
  if (bda == NULL || str == NULL || size < 18)
  {
    return NULL;
  }
  sprintf(str, "%02x:%02x:%02x:%02x:%02x:%02x",
          bda[0], bda[1], bda[2], bda[3], bda[4], bda[5]);
  return str;
}

void removePairedDevice(int index)
{
  esp_err_t tError = esp_bt_gap_remove_bond_device(pairedDeviceBtAddr[index]);
  if (ESP_OK == tError)
  {
    Serial.print("Removed bonded device # ");
  }
  else
  {
    Serial.print("Failed to remove bonded device # ");
  }
}
void listPairedDevices()
{
  pairedDeviceCount = esp_bt_gap_get_bond_device_num();
  if (!pairedDeviceCount)
  {
    Serial.println("No bonded device found.");
  }
  else
  {
    Serial.print("Bonded device count: ");
    Serial.println(pairedDeviceCount);
  }
}
void removePairedDevices()
{
  if (PAIR_MAX_DEVICES < pairedDeviceCount)
  {
    pairedDeviceCount = PAIR_MAX_DEVICES;
    Serial.print("Reset bonded device count: ");
    Serial.println(pairedDeviceCount);

    esp_err_t tError = esp_bt_gap_get_bond_device_list(&pairedDeviceCount, pairedDeviceBtAddr);
    if (ESP_OK == tError)
    {
      for (int i = 0; i < pairedDeviceCount - 4; i++)
      // delete all paired devices but the last five
      {
        Serial.print("Found bonded device # ");
        Serial.print(i);
        Serial.print(" -> ");
        Serial.println(bda2str(pairedDeviceBtAddr[i], bda_str, 18));

        removePairedDevice(i);
        Serial.println(i);
      }
    }
  }
}

void handleCommand(String data)
{
  if (data == "setup")
  {
    setup();
  }
  if (data == "setupBT")
  {
    initBluetooth();
  }
  if (data == "list")
  {
    listPairedDevices();
  }
  if (data == "remove")
  {
    removePairedDevices();
  }
}