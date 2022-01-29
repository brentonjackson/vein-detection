import os
import numpy as np
import cv2

# c is percent of image filled
def cropCenter(img, c):
    c = c / 100
    h, w, _ = img.shape
    cw = c*w
    ch = c*h
    w1 = (w - cw)/2
    w2 = (w + cw)/2
    h1 = (h - ch)/2
    h2 = (h + ch)/2
    return img[int(h1):int(h2), int(w1):int(w2)]

def helper(img):
    img = cropCenter(img, 10)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    mean = cv2.mean(img)
    
    print(mean)
#    if (//stuff):
 #       return true
  #else return false
    return img

cap = cv2.VideoCapture(0) #cv2.VideoCapture('http://172.22.50.203:8080/video');

while(True):
    # Capture frame-by-frame
    ret, frame = cap.read()
    cropped = helper(frame)
    # Our operations on the frame come here
#    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Display the resulting frame
    cv2.imshow('window', frame)
    cv2.imshow('cropped', cropped)
    if cv2.waitKey(1) & 0xFF == ord('q'):
       break

# When everything done, release the capture
cap.release()
cv2.destroyAllWindows()
