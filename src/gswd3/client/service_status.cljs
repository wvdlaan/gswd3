(ns gswd3.client.service_status)

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
             (fn [d] (if (= (str d.status) "GOOD SERVICE") "normal" "bold")))))
