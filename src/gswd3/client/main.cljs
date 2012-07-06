(ns gswd3.client.main)

(def d3 js/d3)

(defn log [& args]
  (let [s (apply str (interpose "', '" args))]
    (.log js/console (str "log: '" s "'"))))

(defn clj->js
  "Recursively transforms ClojureScript maps into Javascript objects,
   other ClojureScript colls into JavaScript arrays, and ClojureScript
   keywords into JavaScript strings. This function’s approximate inverse
   js->clj is provided by ClojureScript core.

   Borrowed and updated from mmcgrana."
  [x]
  (cond
   (string? x) x
   (keyword? x) (name x)
   (map? x) (.-strobj (reduce (fn [m [k v]]
                                (assoc m (clj->js k) (clj->js v))) {} x))
   (coll? x) (apply array (map clj->js x))
   :else x))

(defn ^:export service_status [jd]
  (.. d3
      (select "body")
      (append "ul")
      (selectAll "li")
      (data jd)
      (enter)
      (append "li")
      (text (fn [d]
              (log (keys (js->clj d)))
              (str (.-name d) ": " (.-status d)))))
  (.. d3
      (selectAll "li")
      (style "font-weight" (fn [d]
                             (if (= (str (.-status d))
                                    "GOOD SERVICE")
                               "normal"
                               "bold")))))

(defn ^:export plaza_traffic [jd]
  (.. d3
      (select "body")
      (append "div")
      (attr "class" "chart")
      (selectAll "div.bar")
      (data jd.cash)
      (enter)
      (append "div")
      (attr "class" "line"))
  (.. d3
      (selectAll "div.line")
      (append "div")
      (attr "class" "label")
      (text (fn [d] (str (.-name d)))))
  (.. d3
      (selectAll "div.line")
      (append "div")
      (attr "class" "bar")
      (style "width" (fn [d] (str (/ (.-count d) 100) "px")))
      (text (fn [d] (Math/round (.-count d))))))

