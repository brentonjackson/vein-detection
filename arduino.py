import serial
import time
ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
time.sleep(2)
ser.reset_input_buffer()
ser.write(str("1").encode('utf-8'))
time.sleep(0.1)
