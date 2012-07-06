(ns gswd3.client.main)

(def d3 js/d3)

(defn log [& args]
  (let [s (apply str (interpose "', '" args))]
    (.log js/console (str "log: '" s "'"))))

(defn ^:export service_status [jd]
  (.. d3
      (select "body")
      (append "ul")
      (selectAll "li")
      (data jd)
      (enter)
      (append "li")
      (text (fn [d]
              (str (.-name d) ": " (.-status d)))))
  (.. d3
      (selectAll "li")
      (style "font-weight" (fn [d]
                             (if (= (str (.-status d))
                                    "GOOD SERVICE")
                               "normal"
                               "bold")))))

