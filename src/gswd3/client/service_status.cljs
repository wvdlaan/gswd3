(ns gswd3.client.service_status
  (:require [gswd3.client.util :as uti]))

(def d3 js/d3)

(defn ^:export draw [jd]
  (.. d3 (select "body")
      (append "ul")
      (selectAll "li")
      (data jd)
      (enter)
      (append "li")
      (text (fn [d]
              (str (.-name d) ": " (.-status d)))))
  (.. d3 (selectAll "li")
      (style "font-weight"
             (fn [d]
               (if (= (str (.-status d)) "GOOD SERVICE") "normal" "bold")))))
