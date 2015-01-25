BEMe
==================

Хэлпер для автогенерации файловой структуры BEM с помоью командной строки.

Установка
==
npm i beme  
Требуется глобально установленный gulp: npm i gulp -g

Использование
==
Задача создания  
Принимает набор аргументов в виде типов файлов (или их сокращений) и создает файлы, используя шаблоны в поставке тулзы.

Интерфейс командной строки  
gulp create -f [file path] -p "[file types]", где file path — это путь к БЕМ-сущности, file types — строка, содержащая типы файлов для создания в виде сокращений с разделением через пробел.  
Пример: gulp create -f ~/testBlock/__elem -p "css js" приведет к тому, что в ~/testBlock/__elem появятся 2 файла: testBlock__elem.js и testBlock__elem.css.

Реплейсы шаблонов  
При создании файлов БЕМ-сущностей в шаблонах вхождения {{blockName}}, {{elemName}}, {{modName}} будут заменены на соответствующие сущности имена. Дефолтный шаблон css-файла содержит .{{blockName}}{{elemName}}{{modName}} {}, таким образом результирующий css-файл из примера выше будет содержать .testBlock__elem {}.

Пример настройки задачи создания для webstorm через external tools:  
![](http://jing.yandex-team.ru/files/f0rmat1k/2015-01-25_1632.png)  
Для большего удобства можно настроить hotkey для запуска задачи. Рекомендуемое сочетание ctrl + c (c в контексте create). Настраивается в keymap.

Автозадача  
Вызывает действите по-умолчанию относительно BEM-сущности. В данный момент работают следующие вещи следующим образом:  
1. Если целью яляется каталог блока, элемента или модификатора, то запускается задача создания с единственным типов файла — css.
2. !Эксперементально: Если целью является deps-файл, то создается набор пустых каталогов всех элементов блока.

Интерфейс командной строки:  
gulp -f [FilePath], где FilePath — это путь к бем-сущности  

Пример настройки автозадачи для webstorm через external tools:  
![](http://jing.yandex-team.ru/files/f0rmat1k/2015-01-25_1504.png)  
Для большего удобства можно настроить hotkey для запуска задачи. Рекомендуемое сочетание ctrl + a (c в контексте automatic). Настраивается в keymap.
