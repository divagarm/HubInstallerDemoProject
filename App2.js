import React, {useState, useEffect} from 'react';
import {View, NativeModules, NativeEventEmitter} from 'react-native';
import BleManager from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export const App2 = () => {
  useEffect(() => {
    console.log('startScan');

    BleManager.start({showAlert: false}).then(() => {
      // Success code
      console.log('Module initialized');
      let gotIt = false;

      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        (...data) => {
          console.log('BleManagerDisconnectPeripheral', data);
        },
      );

      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        (peripheral) => {
          if (gotIt) {
            return;
          }
          console.log('Got ble peripheral', peripheral);
          gotIt = true;

          BleManager.connect(peripheral.id)
            .then(() => {
              // Success code
              console.log('Connected');

              BleManager.retrieveServices(peripheral.id).then(
                async (peripheralInfo) => {
                  // Success code
                  console.log('Peripheral info:', peripheralInfo);

                  for (let i = 0; i < 45; i++) {
                    const resultArray = [];
                    let readMore = true;
                    do {
                      let res = await BleManager.read(
                        peripheral.id,
                        'c3b44adb-a1a3-45b7-be39-e0a6ce8b5191',
                        'e1a3b44e-2761-4c51-90b8-b5f986e86cdb',
                      );
                      console.log('res', res);

                      if (resultArray.includes(res.value)) {
                        readMore = false;
                      } else {
                        resultArray.push(res.value);
                      }
                    } while (readMore);

                    await new Promise((resolve) => {
                      setTimeout(() => {
                        resolve();
                      }, 1000);
                      // }, (i%2 === 0) ? 10000 : 2000);
                    });
                  }
                },
              );
            })
            .catch((error) => {
              // Failure code
              console.log(error);
            });
        },
      );

      BleManager.scan(['c3b44adb-a1a3-45b7-be39-e0a6ce8b5191'], 60, false)
        .then((results) => {
          console.log('Scanning...', results);
        })
        .catch((err) => {
          console.log('error...', err);
        });
    });
  }, []);

  return <View />;
};
