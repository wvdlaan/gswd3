(ns gswd3.client.plaza_traffic)

;; sample from plaza_traffic.json
;; {
;;   "count": 26774.09756097561,
;;   "id": 1,
;;   "name": "Robert F. Kennedy Bridge Bronx Plaza"
;; }

(def d3 js/d3)

(defn ^:export draw [jd]
  (.. d3 (select "body")
      (append "div")
      (attr "class" "chart")
      (selectAll "div.bar")
      (data jd.cash)
      (enter)
      (append "div")
      (attr "class" "line"))
  (.. d3 (selectAll "div.line")
      (append "div")
      (attr "class" "label")
      (text (fn [d] (str d.name))))
  (.. d3 (selectAll "div.line")
      (append "div")
      (attr "class" "bar")
      (style "width" (fn [d] (str (/ d.count 100) "px")))
      (text (fn [d] (Math/round d.count)))))
