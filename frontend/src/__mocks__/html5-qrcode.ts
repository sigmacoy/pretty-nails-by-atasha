// Mock for html5-qrcode to prevent memory leaks in tests
const mockHtml5Qrcode = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn(),
};

class Html5Qrcode {
  constructor() {
    return mockHtml5Qrcode;
  }

  static getCameras() {
    return Promise.resolve([]);
  }
}

class Html5QrcodeScanner {
  constructor() {
    return mockHtml5Qrcode;
  }
}

export { Html5Qrcode, Html5QrcodeScanner };
export default Html5Qrcode;