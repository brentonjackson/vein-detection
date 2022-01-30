import os
import numpy as np
import cv2
import serial

ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
CODE_LED_ON = int(1)
CODE_LED_OFF = int(0)
CODE_CHANGE_MOTOR_SPEED = int(3)

def turnLedOn():
        ser.write(CODE_LED_ON.to_bytes(1, byteorder='little'))
             
def turnLedOff():
        ser.write(CODE_LED_OFF.to_bytes(1, byteorder='little'))


maxValue = 150
cropSize = 4

def getCenter(img, c):
    c = c / 100
    h, w, _ = img.shape
    cw = c*w
    ch = c*h
    w1 = (w - cw)/2
    w2 = (w + cw)/2
    h1 = (h - ch)/2
    h2 = (h + ch)/2
    return int(w1), int(w2), int(h1), int(h2)

# c is percent of image filled
def cropCenter(img, c):
    w1, w2, h1, h2 = getCenter(img, c)
    return img[int(h1):int(h2), int(w1):int(w2)]

def processImage(img):
    img = cropCenter(img, cropSize)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    cv2.imshow('cropped', img)
    mean = cv2.mean(img)
    

    value = mean[2]
    print(value)
    isVein = value < maxValue
    #print(isVein)
    return isVein

cap = cv2.VideoCapture('http://172.22.50.203:6677/videofeed')

while(True):
    # Capture frame-by-frame
    ret, frame = cap.read()
    isVein = processImage(frame)
    if isVein:
        turnLedOn()
    else:
        turnLedOff()
    # Our operations on the frame come here
#    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    w1, w2, h1, h2 = getCenter(frame, cropSize)
    frame = cv2.rectangle(frame, (w1, h1), (w2, h2), (0, 255, 0), 2)

    # Display the resulting frame
    cv2.imshow('window', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
       break

# When everything done, release the capture
cap.release()
cv2.destroyAllWindows()
