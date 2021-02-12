import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';

import BleManager from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState([]);

  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 30, true)
        .then((results) => {
          console.log('Scanning...');
          setIsScanning(true);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  };

  const handleDisconnectedPeripheral = (data) => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
  };

  const handleUpdateValueForCharacteristic = (data) => {
    console.log(
      'Received data from ' +
        data.peripheral +
        ' characteristic ' +
        data.characteristic,
      data.value,
    );
  };

  const retrieveConnected = () => {
    BleManager.getConnectedPeripherals([]).then((results) => {
      if (results.length == 0) {
        console.log('No connected peripherals');
      }
      console.log(results);
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
      }
    });
  };

  const handleDiscoverPeripheral = (peripheral) => {
    console.log('Got ble peripheral', peripheral);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
    peripherals.set(peripheral.id, peripheral);
    setList(Array.from(peripherals.values()));
  };

  const testPeripheral = (peripheral) => {
    if (peripheral) {
      BleManager.connect(peripheral.id)
        .then(() => {
          // Success code
          console.log('Connected');

          BleManager.retrieveServices(peripheral.id).then(
            async (peripheralInfo) => {
              // Success code
              console.log('Peripheral info:', peripheralInfo);

              const resultArray = [];
              let readMore = true;
              do {
                let res = await BleManager.read(
                  peripheral.id,
                  'c3b44adb-a1a3-45b7-be39-e0a6ce8b5191',
                  SYS_TIME_CHAR,
                );
                console.log('res', res);

                // const buffer = Buffer.Buffer.from(res);
                // const sensorData = buffer.readUInt8(1, true);

                // console.log("sensorData", sensorData);

                if (resultArray.includes(res.value)) {
                  readMore = false;
                } else {
                  resultArray.push(res.value);
                }
              } while (readMore);
            },
          );
        })
        .catch((error) => {
          // Failure code
          console.log(error);
        });
    }
  };

  useEffect(() => {
    BleManager.start({showAlert: false});

    bleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      handleDiscoverPeripheral,
    );
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener(
      'BleManagerDisconnectPeripheral',
      handleDisconnectedPeripheral,
    );
    bleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      handleUpdateValueForCharacteristic,
    );

    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ).then((result) => {
        if (result) {
          console.log('Permission is OK');
        } else {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ).then((result) => {
            if (result) {
              console.log('User accept');
            } else {
              console.log('User refuse');
            }
          });
        }
      });
    }

    return () => {
      console.log('unmount');
      bleManagerEmitter.removeEventListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      );
      bleManagerEmitter.removeEventListener(
        'BleManagerStopScan',
        handleStopScan,
      );
      bleManagerEmitter.removeEventListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      );
      bleManagerEmitter.removeEventListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      );
    };
  }, []);

  const renderItem = (item) => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableHighlight onPress={() => testPeripheral(item)}>
        <View style={[styles.row, {backgroundColor: color}]}>
          <Text
            style={{
              fontSize: 12,
              textAlign: 'center',
              color: '#333333',
              padding: 10,
            }}>
            {item.name}
          </Text>
          <Text
            style={{
              fontSize: 10,
              textAlign: 'center',
              color: '#333333',
              padding: 2,
            }}>
            RSSI: {item.rssi}
          </Text>
          <Text
            style={{
              fontSize: 8,
              textAlign: 'center',
              color: '#333333',
              padding: 2,
              paddingBottom: 20,
            }}>
            {item.id}
          </Text>
        </View>
      </TouchableHighlight>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}
          <View style={styles.body}>
            <View style={{margin: 10}}>
              <Button
                title={'Scan Bluetooth (' + (isScanning ? 'on' : 'off') + ')'}
                onPress={() => startScan()}
              />
            </View>

            <View style={{margin: 10}}>
              <Button
                title="Retrieve connected peripherals"
                onPress={() => retrieveConnected()}
              />
            </View>

            {list.length == 0 && (
              <View style={{flex: 1, margin: 20}}>
                <Text style={{textAlign: 'center'}}>No peripherals</Text>
              </View>
            )}
          </View>
        </ScrollView>
        <FlatList
          data={list}
          renderItem={({item}) => renderItem(item)}
          keyExtractor={(item) => item.id}
        />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
