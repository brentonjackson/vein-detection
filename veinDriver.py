import os
import numpy as np
import cv2
import serial
from datetime import datetime
from datetime import timedelta
from time import sleep
import RPi.GPIO as gpio


CODE_LED_ON = int(1)
CODE_LED_OFF = int(0)
CODE_CHANGE_MOTOR_SPEED = int(3)

led = 11
gpio.setmode(gpio.BOARD)
gpio.setup(led, gpio.OUT)

def turnLedOn():
        gpio.output(led, gpio.HIGH)
             
def turnLedOff():
        gpio.output(led, gpio.LOW)

 
maxValue = 150
cropSize = 15

def getCenter(img, c):
    c = c / 100
    h = img.shape[0]
    w = img.shape[1]
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
    return isVein


minMean = 20
kern1 = np.ones((5, 5))
kern2 = np.ones((11, 11))
def processImage2(img):
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = cv2.GaussianBlur(img, (5, 5), 0)
    img = cv2.Laplacian(img, cv2.CV_8U,ksize=7)
    ret, img = cv2.threshold(img, 50, 255, cv2.THRESH_BINARY)
    img = cv2.erode(img, kern1)
    img = cv2.dilate(img, kern2)
    img = cropCenter(img, cropSize)
        
    cv2.imshow('processed', img)
    mean = np.mean(cv2.mean(img))
    print(mean)
    return mean > minMean

#cap = cv2.VideoCapture('http://172.22.50.203:8080/videofeed')
cap = cv2.VideoCapture('http://198.21.200.255:8081/video')

injected = False
now = datetime.now()
while(True):
    # Capture frame-by-frame
    ret, frame = cap.read()
    isVein = processImage2(frame)
    if isVein:
        turnLedOn()
        if datetime.now() - now > timedelta(seconds=1):
            injected = True
            break
    else:
        turnLedOff()
        now = datetime.now()

    w1, w2, h1, h2 = getCenter(frame, cropSize)
    frame = cv2.rectangle(frame, (w1, h1), (w2, h2), (0, 255, 0), 2)

    # Display the resulting frame
    cv2.imshow('window', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
       break
if injected:
    print("Injected!")
# When everything done, release the capture
gpio.cleanup()
cap.release()
cv2.destroyAllWindows()
