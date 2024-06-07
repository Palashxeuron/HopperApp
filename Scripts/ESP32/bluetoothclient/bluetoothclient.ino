#include <map>
#include <BluetoothSerial.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to and enable it
#endif

#if !defined(CONFIG_BT_SPP_ENABLED)
#error Serial Bluetooth not available or not enabled. It is only available for the ESP32 chip.
#endif

BluetoothSerial SerialBT;

#define BT_DISCOVER_TIME 10000
esp_spp_sec_t sec_mask = ESP_SPP_SEC_NONE;  // or ESP_SPP_SEC_ENCRYPT|ESP_SPP_SEC_AUTHENTICATE to request pincode confirmation
esp_spp_role_t role = ESP_SPP_ROLE_SLAVE;   // or ESP_SPP_ROLE_MASTER

// std::map<BTAddress, BTAdvertisedDeviceSet> btDeviceList;

void setup() {
  Serial.begin(115200);
    if (!SerialBT.begin("Smart scale", true)) {
    Serial.println("========== serialBT failed!");
    abort();
  }else {
    Serial.println("Bluetooth initialized");
  }
    // SerialBT.setPin("1234"); // doesn't seem to change anything
  // SerialBT.enableSSP(); // doesn't seem to change anything
  
  Serial.println("The device started, now you can pair it with Bluetooth!");
}

void loop() {
  if (Serial.available()) {
    SerialBT.write(Serial.read());
  }
  if (SerialBT.available()) {
    Serial.write(SerialBT.read());
  }else {
    Serial.println("not connected");   
    delay(1000);
  }
  if (SerialBT.hasClient()) {
    Serial.println("Client connected");
  } else {
    Serial.println("No client connected");
  }
}
