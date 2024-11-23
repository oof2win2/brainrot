import cv2
import dbutils
from PIL import Image
import threading

if __name__ == "__main__":
    cam = cv2.VideoCapture(0)
    frame_counter = 0
    while cam.isOpened():
        ret, frame = cam.read()
        if not ret:
            break
        # turn frame into base64
        cv2.resize(frame, (480, 270))
        cv2.imshow("frame", frame)

        if frame_counter % 30 == 0:
            img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            threading.Thread(
                target=dbutils.store_frame, args=(img, frame_counter)
            ).start()

        frame_counter += 1
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    cam.release()
    cv2.destroyAllWindows()
