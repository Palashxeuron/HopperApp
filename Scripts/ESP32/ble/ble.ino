#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID_TX "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define CHARACTERISTIC_UUID_RX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

BLEServer* pServer = NULL;
BLECharacteristic* pTxCharacteristic;
bool deviceConnected = false;
bool oldDeviceConnected = false;
uint32_t value = 0;
#define RX 16
#define TX 17

bool debug = true; // set to false once done developing and testing

// Function declarations
void initBLE();
void readArduino();
void sendToArduino(String data);
bool isArduinoMessage(String data);
String extractArduinoMessage(String data);
bool isMasterMessage(std::string data);
std::string extractMasterMessage(std::string data);
void logMessage(String data);

// Define the Server Callbacks class
class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("Client Connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    Serial.println("Client Disconnected");
  }
};

// Define the Characteristic Callbacks class
class MyCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();

    if (rxValue.length() > 0) {
      Serial.println("*********");
      Serial.print("Received Value: ");
      for (int i = 0; i < rxValue.length(); i++)
        Serial.print(rxValue[i]);

      Serial.println();
      Serial.println("*********");

      // Do stuff based on the command received from master
      // Example: send the data to Arduino
      if (isMasterMessage(rxValue)) {
        std::string message = extractMasterMessage(rxValue);
        logMessage("received from master: " + String(message.c_str()));
        sendToArduino(String(message.c_str()));
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RX, TX); // connection to Arduino
  initBLE();
  delay(1000);
}

void loop() {
  // Notify changed value
  if (deviceConnected) {
    readArduino();
  }

  // disconnecting
  if (!deviceConnected && oldDeviceConnected) {
    delay(500); // give the bluetooth stack the chance to get things ready
    pServer->startAdvertising(); // restart advertising
    Serial.println("start advertising");
    oldDeviceConnected = deviceConnected;
  }
  // connecting
  if (deviceConnected && !oldDeviceConnected) {
    // do stuff here on connecting
    oldDeviceConnected = deviceConnected;
  }
}

void initBLE() {
  BLEDevice::init("Smart-Scale");

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pTxCharacteristic = pService->createCharacteristic(
                       CHARACTERISTIC_UUID_TX,
                       BLECharacteristic::PROPERTY_NOTIFY
                     );

  BLECharacteristic* pRxCharacteristic = pService->createCharacteristic(
                         CHARACTERISTIC_UUID_RX,
                         BLECharacteristic::PROPERTY_WRITE
                       );

  pRxCharacteristic->setCallbacks(new MyCallbacks());

  pService->start();
  pServer->getAdvertising()->addServiceUUID(SERVICE_UUID);
  pServer->getAdvertising()->start();
  Serial.println("Waiting a client connection to notify...");
}

void readArduino() {
  String str = "";
  while (Serial2.available()) {
    char c = Serial2.read();
    str += c;
  }
  if (isArduinoMessage(str)) {
    str = extractArduinoMessage(str);
    pTxCharacteristic->setValue(str.c_str()); // send to the Bluetooth client
    pTxCharacteristic->notify();              // notify the client
    logMessage("arduino: " + str); // send to the serial monitor
  }
}

void sendToArduino(String data) {
  logMessage("sending to arduino: " + data); // send to the serial monitor
  Serial2.println(data);
}

bool isArduinoMessage(String data) {
  String startMarker_Ard = "arduino:";
  String endMarker_Ard = ":oniudra";
  return data.indexOf(startMarker_Ard) >= 0 && data.indexOf(endMarker_Ard) >= 0;
}

String extractArduinoMessage(String data) {
  String startMarker_Ard = "arduino:";
  String endMarker_Ard = ":oniudra";
  int startIndex = data.indexOf(startMarker_Ard) + startMarker_Ard.length();
  int endIndex = data.indexOf(endMarker_Ard);
  return data.substring(startIndex, endIndex);
}

bool isMasterMessage(std::string data) {
  std::string startMarker_Master = "master:";
  std::string endMarker_Master = ":retsam";
  return data.find(startMarker_Master) != std::string::npos && data.find(endMarker_Master) != std::string::npos;
}

std::string extractMasterMessage(std::string data) {
  std::string startMarker_Master = "master:";
  std::string endMarker_Master = ":retsam";
  int startIndex = data.find(startMarker_Master) + startMarker_Master.length();
  int endIndex = data.find(endMarker_Master);
  return data.substr(startIndex, endIndex - startIndex);
}

void logMessage(String data) {
  if (debug) {
    Serial.println(data);
  }
}
