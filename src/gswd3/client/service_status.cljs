(ns gswd3.client.service_status)

;; sample from service_status.json
;; {
;;   "status": ["GOOD SERVICE"],
;;   "name": ["123"],
;;   "url": [null],
;;   "text": ["..."],
;;   "plannedworkheadline": [null],
;;   "Time": [" 7:35AM"],
;;   "Date": ["12/15/2011"]
;; }

(def d3 js/d3)

(defn ^:export draw [jd]
  (.. d3 (select "body")
      (append "ul")
      (selectAll "li")
      (data jd)
      (enter)
      (append "li")
      (text (fn [d] (str d.name ": " d.status))))
  (.. d3 (selectAll "li")
      (style "font-weight"
             (fn [d]
               (if (= (str d.status) "GOOD SERVICE")
                 "normal"
                 "bold")))))
