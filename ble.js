const { createBluetooth } = require("node-ble");

function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function main() {
  const { bluetooth, destroy } = createBluetooth();

  // get bluetooth adapter
  const adapter = await bluetooth.defaultAdapter();
  // 设备的 uuid 已经获取，先写死 C3:7B:AA:C4:52:4B
  const device = await adapter.waitDevice("C3:7B:AA:C4:52:4B");
  console.log("got device", await device.getAddress(), await device.getName());
  await device.connect();
  console.log("connected");

  const gattServer = await device.gatt();

  // 链接 service
  const service1 = await gattServer.getPrimaryService(
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
  );

  // =========================轨迹数据==============================
  // 链接 Characteristic 6e400002-b5a3-f393-e0a9-e50e24dcca9e，尝试获取轨迹数据
  const characteristic1 = await service1.getCharacteristic(
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
  );
  // 发送轨迹数据请求
  const res = await characteristic1.writeValue(
    Buffer.from([181, 91, 4, 1, 2, 50, 3, 56, 170])
  );
  // 舱室读取轨迹数据
  const buffer = await characteristic1.readValue();
  console.log("read: ", buffer);

  // =========================电池数据==============================
  // 监听 6e400003-b5a3-f393-e0a9-e50e24dcca9e，尝试读取电池数据
  const characteristic2 = await service1.getCharacteristic(
    "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
  );

  // 开启监听
  await characteristic2.startNotifications();

  // 数据回调
  characteristic2.on("valuechanged", buffer => {
    console.log(buffer);
  });

  await wait(10 * 1000);

  await characteristic2.stopNotifications();

  destroy();
}

main().then(console.log).catch(console.error);
