import {
    NativeModules,
    NativeEventEmitter,
} from 'react-native';
import BleManager from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export class BleManagerPlugin {
    constructor() {


        // bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
        // bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
        // bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic );
    }

    startScan = () => {
        console.log("startScan");

        BleManager.start({ showAlert: false }).then(() => {
            // Success code
            console.log("Module initialized");
            let gotIt = false;

            bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', (...data) => {
                console.log("BleManagerDisconnectPeripheral", data);
            });

            bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral) => {
                if(gotIt) {
                    return;
                }
                console.log('Got ble peripheral', peripheral);
                gotIt = true;

                BleManager.connect(peripheral.id)
                    .then(() => {
                        // Success code
                        console.log("Connected");

                        BleManager.retrieveServices(peripheral.id).then(
                            async (peripheralInfo) => {
                                // Success code
                                console.log("Peripheral info:", peripheralInfo);

                                const resultArray = [];
                                let readMore = true;
                                do {
                                    let res = await BleManager.read(
                                            peripheral.id,
                                            "c3b44adb-a1a3-45b7-be39-e0a6ce8b5191",
                                            'e1a3b44e-2761-4c51-90b8-b5f986e86cdb'
                                        );
                                    console.log("res", res);

                                    const buffer = Buffer.Buffer.from(res);
                                    const sensorData = buffer.readUInt8(1, true);

                                    console.log("sensorData", sensorData);

                                    if (resultArray.includes(res.value)) {
                                        readMore = false;
                                    } else {
                                        resultArray.push(res.value);
                                    }
                                } while (readMore);

                            }
                        );
                    })
                    .catch((error) => {
                        // Failure code
                        console.log(error);
                    });

            });

            BleManager.scan(["c3b44adb-a1a3-45b7-be39-e0a6ce8b5191"], 60, false).then((results) => {
                console.log('Scanning...', results);
            }).catch(err => {
                console.log('error...', err);
            });
        });

    }

}
