(ns gswd3.client.plaza_traffic
  (:require [gswd3.client.util :as uti]))

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
      (text (fn [d] (str (.-name d)))))
  (.. d3 (selectAll "div.line")
      (append "div")
      (attr "class" "bar")
      (style "width" (fn [d] (str (/ (.-count d) 100) "px")))
      (text (fn [d] (Math/round (.-count d))))))
