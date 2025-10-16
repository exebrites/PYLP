use_module(library(readutil)).

% Predicado para preguntar si es de día y obtener una respuesta 'si' o 'no'
preguntar :-
    writeln('Es de dia (si/no)'),
    read_line_to_string(user_input, RespuestaDiaString),
    % Convertimos la respuesta a minúsculas para manejar 'Si', 'SI', etc.
    string_lower(RespuestaDiaString, RespuestaDiaLower),
    
    % Llamamos a saludo con la respuesta y obtenemos un resultado
    saludo(Resultado, RespuestaDiaLower),
    
    writeln('Resultado: '), 
    writeln(Resultado). % Usamos writeln para imprimir la cadena del resultado

% Definición del predicado saludo/2
% Si la respuesta es 'si', el saludo es "¡Buenos días!"
saludo('Buenos dias', "si").
% Si la respuesta es 'no', el saludo es "¡Buenas noches!"
saludo('Buenas noches"' "no").
% Si la respuesta es otra cosa, podemos dar un mensaje de error o por defecto
saludo("No entiendo tu respuesta. Por favor, responde 'si' o 'no'.", _).
%--------------------------------------------------------------------------
% Llamamos al predicado principal para iniciar la interacción con el usuario
% :- preguntar.